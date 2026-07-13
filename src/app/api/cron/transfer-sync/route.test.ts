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

jest.mock("@/lib/monitoring/check-in", () => ({
  sendTransferSyncCheckIn: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { runTransferSync } from "@/lib/transfer-sync";
import { sendTransferSyncCheckIn } from "@/lib/monitoring/check-in";

const mockedRunTransferSync = runTransferSync as jest.MockedFunction<
  typeof runTransferSync
>;
const mockedSendCheckIn = sendTransferSyncCheckIn as jest.MockedFunction<
  typeof sendTransferSyncCheckIn
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
    mockedSendCheckIn.mockResolvedValue(undefined);
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

  it("does not send a success check-in for action: error", async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: "error",
      error: "boom",
    });

    const response = await GET(authorizedRequest());
    expect(response.status).toBe(500);
    expect(mockedSendCheckIn).not.toHaveBeenCalled();
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("sends a success check-in for not_due when configured helper runs", async () => {
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
    expect(mockedSendCheckIn).toHaveBeenCalledTimes(1);
    expect(mockedSendCheckIn.mock.calls[0][0].result).toEqual({
      action: "skipped",
      reason: "not_due",
    });
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("does not turn a successful cron result into an error when check-in fails", async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: "skipped",
      reason: "lease_held",
      state: {
        id: "transfer",
        status: "running",
        cursor: 10,
        expected_count: 100,
        imported_count: 5,
        started_at: null,
        completed_at: null,
        next_due_at: null,
        lease_expires_at: new Date(),
        last_error: null,
        sync_id: "sync-1",
        failed_experience_count: 0,
      },
    });
    mockedSendCheckIn.mockRejectedValue(new Error("check-in failed"));

    const response = await GET(authorizedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      action: "skipped",
      reason: "lease_held",
    });
    expect(mockedSendCheckIn).toHaveBeenCalledTimes(1);
  });
});
