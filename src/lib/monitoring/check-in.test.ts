/**
 * @jest-environment node
 */

import { sendTransferSyncCheckIn } from "./check-in";

describe("sendTransferSyncCheckIn", () => {
  const originalUrl = process.env.HONEYBADGER_TRANSFER_CHECKIN_URL;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.HONEYBADGER_TRANSFER_CHECKIN_URL;
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    if (originalUrl === undefined) {
      delete process.env.HONEYBADGER_TRANSFER_CHECKIN_URL;
    } else {
      process.env.HONEYBADGER_TRANSFER_CHECKIN_URL = originalUrl;
    }
  });

  it("is a no-op when HONEYBADGER_TRANSFER_CHECKIN_URL is absent", async () => {
    await sendTransferSyncCheckIn({
      durationMs: 10,
      result: { action: "skipped", reason: "not_due" },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs a success payload with safe result fields", async () => {
    process.env.HONEYBADGER_TRANSFER_CHECKIN_URL =
      "https://api.honeybadger.io/v1/check_in/test";
    fetchMock.mockResolvedValue({ ok: true });

    await sendTransferSyncCheckIn({
      durationMs: 1234,
      result: {
        action: "batch",
        processed: 20,
        imported: 18,
        cursor: 40,
        expected: 100,
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.honeybadger.io/v1/check_in/test");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");

    const body = JSON.parse(init.body as string);
    expect(body.check_in.status).toBe("success");
    expect(body.check_in.duration).toBe(1234);
    expect(body.check_in.exit_code).toBe(0);
    expect(JSON.parse(body.check_in.stdout)).toEqual({
      action: "batch",
      processed: 20,
      imported: 18,
      cursor: 40,
      expected: 100,
    });
  });

  it("logs a warning and does not throw when Honeybadger is unreachable", async () => {
    process.env.HONEYBADGER_TRANSFER_CHECKIN_URL =
      "https://api.honeybadger.io/v1/check_in/test";
    fetchMock.mockRejectedValue(new Error("network down"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      sendTransferSyncCheckIn({
        durationMs: 5,
        result: { action: "skipped", reason: "not_due" },
      })
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
