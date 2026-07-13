const CHECKIN_TIMEOUT_MS = 5_000;
const MAX_STDOUT_CHARS = 2_000;

export type TransferSyncCheckInResult = {
  action: string;
  reason?: string;
  processed?: number;
  imported?: number;
  cursor?: number;
  expected?: number;
};

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)}…`;
}

function buildStdout(result: TransferSyncCheckInResult): string {
  const payload: Record<string, string | number> = {
    action: result.action,
  };

  if (result.reason !== undefined) {
    payload.reason = result.reason;
  }
  if (result.processed !== undefined) {
    payload.processed = result.processed;
  }
  if (result.imported !== undefined) {
    payload.imported = result.imported;
  }
  if (result.cursor !== undefined) {
    payload.cursor = result.cursor;
  }
  if (result.expected !== undefined) {
    payload.expected = result.expected;
  }

  return truncate(JSON.stringify(payload), MAX_STDOUT_CHARS);
}

/**
 * Best-effort Honeybadger check-in for the transfer-sync cron.
 * No-ops when HONEYBADGER_TRANSFER_CHECKIN_URL is absent.
 * Never throws; never includes secrets.
 */
export async function sendTransferSyncCheckIn(options: {
  durationMs: number;
  result: TransferSyncCheckInResult;
}): Promise<void> {
  const url = process.env.HONEYBADGER_TRANSFER_CHECKIN_URL?.trim();
  if (!url) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECKIN_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        check_in: {
          status: "success",
          duration: Math.max(0, Math.round(options.durationMs)),
          stdout: buildStdout(options.result),
          exit_code: 0,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `Honeybadger transfer check-in failed: HTTP ${response.status}`
      );
    }
  } catch (error) {
    console.warn(
      "Honeybadger transfer check-in unreachable:",
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    clearTimeout(timeout);
  }
}
