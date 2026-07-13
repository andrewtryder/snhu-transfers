import Honeybadger from "@honeybadger-io/js";
import type { TransferSyncState } from "@/lib/transfer-sync/persist";
import { HONEYBADGER_FILTERS } from "../../../honeybadger.filters.js";

export type ReportServerErrorOptions = {
  context?: Record<string, unknown>;
  tags?: string[];
  component?: string;
  action?: string;
};

let configured = false;

function ensureConfigured(): boolean {
  const apiKey = process.env.HONEYBADGER_API_KEY?.trim();
  if (!apiKey) {
    return false;
  }

  if (!configured) {
    Honeybadger.configure({
      apiKey,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      revision: process.env.VERCEL_GIT_COMMIT_SHA,
      filters: [...HONEYBADGER_FILTERS],
    });
    configured = true;
  }

  return true;
}

function toNoticeable(error: Error | unknown): Error | string {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return error;
  }
  return new Error(String(error));
}

/**
 * Server-only Honeybadger notify helper.
 * No-ops without HONEYBADGER_API_KEY. Never throws back to callers.
 */
export async function reportServerError(
  error: Error | unknown,
  options: ReportServerErrorOptions = {}
): Promise<void> {
  try {
    if (!ensureConfigured()) {
      return;
    }

    await Honeybadger.notifyAsync(toNoticeable(error), {
      component: options.component,
      action: options.action,
      context: options.context,
      tags: options.tags,
    });
  } catch {
    // Swallow notifier failures so application control flow is unchanged.
  }
}

export type TransferSyncErrorContext = {
  state?: TransferSyncState | null;
  allowLargeShrink?: boolean;
};

/**
 * Report a caught transfer-sync failure with safe structured context.
 */
export async function reportTransferSyncError(
  error: Error | unknown,
  context: TransferSyncErrorContext = {}
): Promise<void> {
  const state = context.state ?? null;

  await reportServerError(error, {
    component: "transfer-sync",
    action: "transfer-sync",
    tags: ["cron", "transfer-sync"],
    context: {
      job: "transfer-sync",
      component: "transfer-sync",
      cursor: state?.cursor,
      expected_count: state?.expected_count,
      imported_count: state?.imported_count,
      failed_experience_count: state?.failed_experience_count,
      ...(state?.sync_id ? { sync_id: state.sync_id } : {}),
      status: state?.status,
      ...(context.allowLargeShrink !== undefined
        ? { allow_large_shrink: context.allowLargeShrink }
        : {}),
      vercel_env: process.env.VERCEL_ENV ?? null,
    },
  });
}

/** Reset configure latch between tests. */
export function resetHoneybadgerConfigForTests(): void {
  configured = false;
}
