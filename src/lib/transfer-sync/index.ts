import { Client } from 'pg';
import { fetchExperienceDetail, fetchExperiences, type KualiExperienceListItem } from './fetch';
import { parseExperienceDetail, type ParsedTransferCourse } from './parse';
import {
  advanceCursor,
  getSyncState,
  insertStagedTransfer,
  isLeaseActive,
  refreshLease,
  setSyncError,
  startRefresh,
  type TransferSyncState,
} from './persist';
import { promoteStaging } from './promote';

export const CRON_BATCH_SIZE = 20;
export const CRON_CONCURRENCY = 5;
export const BOOTSTRAP_CONCURRENCY = 8;

export type TransferSyncResult =
  | { action: 'skipped'; reason: string; state: TransferSyncState }
  | {
      action: 'batch';
      processed: number;
      imported: number;
      cursor: number;
      expected: number;
      done: false;
    }
  | {
      action: 'promoted';
      processed: number;
      imported: number;
      expected: number;
      done: true;
    }
  | { action: 'error'; error: string };

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchAndParseBatch(
  listItems: KualiExperienceListItem[],
  concurrency: number
): Promise<ParsedTransferCourse[]> {
  const nested = await mapWithConcurrency(listItems, concurrency, async (item) => {
    if (!item.pid) return [] as ParsedTransferCourse[];
    const detail = await fetchExperienceDetail(item.pid);
    if (!detail) return [] as ParsedTransferCourse[];
    return parseExperienceDetail(detail);
  });
  return nested.flat();
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Full local bootstrap: fetch all experiences, fill staging, validate, promote.
 */
export async function bootstrapTransfer(
  options: { concurrency?: number; batchSize?: number } = {}
): Promise<{ imported: number; expected: number }> {
  const concurrency = options.concurrency ?? BOOTSTRAP_CONCURRENCY;
  const batchSize = options.batchSize ?? CRON_BATCH_SIZE;

  return withClient(async (client) => {
    console.log('Fetching complete experience list...');
    const experiences = await fetchExperiences();

    console.log(`Found ${experiences.length} experiences. Starting staging import...`);
    await startRefresh(client, experiences.length);

    for (let i = 0; i < experiences.length; i += batchSize) {
      const slice = experiences.slice(i, i + batchSize);
      const parsed = await fetchAndParseBatch(slice, concurrency);

      for (const row of parsed) {
        await insertStagedTransfer(client, row);
      }

      const newCursor = i + slice.length;
      await advanceCursor(client, newCursor, parsed.length);
      console.log(
        `Staged batch: ${parsed.length} rows, cursor ${newCursor}/${experiences.length}`
      );

      if (i + batchSize < experiences.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const state = await getSyncState(client);
    console.log(
      `Validating and promoting (${state.imported_count} staged rows from ${state.expected_count} experiences)...`
    );
    await promoteStaging(client);
    console.log('Bootstrap complete');

    return {
      imported: state.imported_count,
      expected: state.expected_count ?? experiences.length,
    };
  });
}

/**
 * One cron/local sync tick:
 * - if running: process next batch (and promote when finished)
 * - else if due: start refresh and process first batch
 * - else: skip
 */
export async function runTransferSync(
  options: { batchSize?: number; concurrency?: number; ignoreLease?: boolean } = {}
): Promise<TransferSyncResult> {
  const batchSize = options.batchSize ?? CRON_BATCH_SIZE;
  const concurrency = options.concurrency ?? CRON_CONCURRENCY;
  const ignoreLease = options.ignoreLease ?? false;

  return withClient(async (client) => {
    try {
      let state = await getSyncState(client);
      const now = new Date();

      if (state.status === 'running') {
        if (!ignoreLease && isLeaseActive(state, now)) {
          return {
            action: 'skipped',
            reason: 'lease_held',
            state,
          };
        }
        await refreshLease(client);
      } else {
        const due =
          state.next_due_at === null || state.next_due_at.getTime() <= now.getTime();
        if (!due) {
          return {
            action: 'skipped',
            reason: 'not_due',
            state,
          };
        }

        console.log('Transfer refresh due; fetching experience list...');
        const experiences = await fetchExperiences();
        await startRefresh(client, experiences.length);
        state = await getSyncState(client);
      }

      const experiences = await fetchExperiences();
      const expected = state.expected_count ?? experiences.length;
      const cursor = state.cursor;

      if (cursor >= expected || cursor >= experiences.length) {
        await promoteStaging(client);
        return {
          action: 'promoted',
          processed: 0,
          imported: state.imported_count,
          expected,
          done: true,
        };
      }

      const end = Math.min(cursor + batchSize, expected, experiences.length);
      const slice = experiences.slice(cursor, end);
      const parsed = await fetchAndParseBatch(slice, concurrency);

      for (const row of parsed) {
        await insertStagedTransfer(client, row);
      }

      const newCursor = end;
      await advanceCursor(client, newCursor, parsed.length);
      const importedTotal = state.imported_count + parsed.length;

      if (newCursor >= expected || newCursor >= experiences.length) {
        await promoteStaging(client);
        return {
          action: 'promoted',
          processed: slice.length,
          imported: importedTotal,
          expected,
          done: true,
        };
      }

      return {
        action: 'batch',
        processed: slice.length,
        imported: parsed.length,
        cursor: newCursor,
        expected,
        done: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        await setSyncError(client, message);
      } catch {
        // ignore secondary failure
      }
      return { action: 'error', error: message };
    }
  });
}
