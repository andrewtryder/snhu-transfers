/**
 * @jest-environment node
 */

import Honeybadger from "@honeybadger-io/js";
import {
  reportServerError,
  reportTransferSyncError,
  resetHoneybadgerConfigForTests,
} from "./honeybadger";

jest.mock("@honeybadger-io/js", () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    notifyAsync: jest.fn(),
  },
}));

const mockedHoneybadger = Honeybadger as unknown as {
  configure: jest.Mock;
  notifyAsync: jest.Mock;
};

describe("reportServerError", () => {
  const originalApiKey = process.env.HONEYBADGER_API_KEY;

  beforeEach(() => {
    resetHoneybadgerConfigForTests();
    mockedHoneybadger.configure.mockReset();
    mockedHoneybadger.notifyAsync.mockReset();
    delete process.env.HONEYBADGER_API_KEY;
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.HONEYBADGER_API_KEY;
    } else {
      process.env.HONEYBADGER_API_KEY = originalApiKey;
    }
  });

  it("is a no-op when HONEYBADGER_API_KEY is absent", async () => {
    await reportServerError(new Error("boom"));

    expect(mockedHoneybadger.configure).not.toHaveBeenCalled();
    expect(mockedHoneybadger.notifyAsync).not.toHaveBeenCalled();
  });

  it("notifies Honeybadger when the API key is present", async () => {
    process.env.HONEYBADGER_API_KEY = "test-key";
    mockedHoneybadger.notifyAsync.mockResolvedValue(undefined);

    const error = new Error("sync failed");
    await reportTransferSyncError(error, {
      state: {
        id: "transfer",
        status: "running",
        cursor: 40,
        expected_count: 100,
        imported_count: 12,
        started_at: null,
        completed_at: null,
        next_due_at: null,
        lease_expires_at: null,
        last_error: null,
        sync_id: "sync-1",
        failed_experience_count: 0,
      },
    });

    expect(mockedHoneybadger.configure).toHaveBeenCalled();
    expect(mockedHoneybadger.notifyAsync).toHaveBeenCalledTimes(1);
    expect(mockedHoneybadger.notifyAsync.mock.calls[0][0]).toBe(error);
    expect(mockedHoneybadger.notifyAsync.mock.calls[0][1]).toMatchObject({
      component: "transfer-sync",
      tags: ["cron", "transfer-sync"],
      context: expect.objectContaining({
        job: "transfer-sync",
        cursor: 40,
        expected_count: 100,
        sync_id: "sync-1",
      }),
    });
  });

  it("does not throw when Honeybadger notify fails", async () => {
    process.env.HONEYBADGER_API_KEY = "test-key";
    mockedHoneybadger.notifyAsync.mockRejectedValue(new Error("hb down"));

    await expect(reportServerError(new Error("boom"))).resolves.toBeUndefined();
  });
});
