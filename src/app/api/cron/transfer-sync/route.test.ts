/**
 * @jest-environment node
 */

import { GET } from "./route";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/transfer-sync", () => ({
  runTransferSync: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { runTransferSync } from "@/lib/transfer-sync";

const mockedRunTransferSync = runTransferSync as jest.MockedFunction<
  typeof runTransferSync
>;
const mockedRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

function authorizedRequest(): Request {
  return new Request("http://localhost/api/cron/transfer-sync", {
    headers: {
      authorization: "Bearer test-secret",
    },
  });
}

describe("transfer-sync cron route", () => {
  const originalSecret = process.env.CRON_SECRET;
  const originalPostgres = process.env.POSTGRES_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    process.env.POSTGRES_URL = "postgres://example";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
    if (originalPostgres === undefined) {
      delete process.env.POSTGRES_URL;
    } else {
      process.env.POSTGRES_URL = originalPostgres;
    }
  });

  it("returns 500 for action: error without revalidating", async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: "error",
      error: "boom",
    });

    const response = await GET(authorizedRequest());
    expect(response.status).toBe(500);
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns 200 for skipped not_due without revalidating", async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: "skipped",
      reason: "not_due",
      state: {
        id: "transfer",
        status: "idle",
        cursor: 0,
        expected_count: null,
        imported_count: 0,
        started_at: null,
        completed_at: null,
        next_due_at: new Date("2099-01-01T00:00:00.000Z"),
        lease_expires_at: null,
        last_error: null,
        sync_id: null,
        failed_experience_count: 0,
      },
    });

    const response = await GET(authorizedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      action: "skipped",
      reason: "not_due",
    });
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates paths after a successful promote", async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: "promoted",
      processed: 10,
      imported: 10,
      expected: 10,
      state: {
        id: "transfer",
        status: "idle",
        cursor: 0,
        expected_count: null,
        imported_count: 0,
        started_at: null,
        completed_at: new Date(),
        next_due_at: new Date("2099-01-01T00:00:00.000Z"),
        lease_expires_at: null,
        last_error: null,
        sync_id: null,
        failed_experience_count: 0,
      },
    });

    const response = await GET(authorizedRequest());
    expect(response.status).toBe(200);
    expect(mockedRevalidatePath).toHaveBeenCalled();
  });
});
