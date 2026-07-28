/**
 * External incremental transfer sync CLI.
 *
 * Runs the full transfer sync to completion — suitable for CircleCI or a
 * trusted desktop machine instead of waiting for multiple Vercel cron ticks.
 *
 * Usage:
 *   npm run transfer:sync
 *   npx tsx scripts/transfer-sync.ts [--ignore-lease] [--allow-large-shrink]
 *
 * Options:
 *   --ignore-lease       Force-take the distributed lease (use when a previous
 *                        run left an expired lease; never use in parallel runs).
 *   --allow-large-shrink Override the 25% live-shrink guard during promotion
 *                        (only needed after a significant data reduction).
 *
 * Exit codes:
 *   0  Sync completed successfully (action: promoted or skipped).
 *   1  Sync encountered an error or environment is misconfigured.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { runTransferSync } from '../src/lib/transfer-sync';

export async function runToCompletion(
  options: { ignoreLease?: boolean; allowLargeShrink?: boolean } = {}
): Promise<number> {
  if (!process.env.POSTGRES_URL) {
    console.error(JSON.stringify({ error: 'POSTGRES_URL is required' }));
    return 1;
  }

  const ignoreLease = options.ignoreLease ?? false;
  const allowLargeShrink = options.allowLargeShrink ?? false;

  if (ignoreLease) {
    console.warn('--ignore-lease: forcibly taking the distributed sync lease');
  }
  if (allowLargeShrink) {
    console.warn('--allow-large-shrink: promotion may replace live data with a smaller staging set');
  }

  let batchCount = 0;

  // Loop until the sync is done, skipped, or encounters an error.
  // This allows the CLI to complete the full sync in one invocation,
  // unlike the Vercel cron which processes one batch per invocation.
  while (true) {
    const result = await runTransferSync({ ignoreLease, allowLargeShrink });
    console.log(JSON.stringify({ batch: batchCount, ...result }));

    if (result.action === 'error') {
      return 1;
    }

    if (result.action === 'skipped') {
      // not_due or lease_held — not an error, but nothing to do.
      return 0;
    }

    if (result.action === 'promoted') {
      // Sync complete.
      return 0;
    }

    // action === 'batch': more batches remain, continue looping.
    batchCount++;

    // Brief pause between batches to avoid overwhelming the database.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function main() {
  const exitCode = await runToCompletion({
    ignoreLease: process.argv.includes('--ignore-lease'),
    allowLargeShrink: process.argv.includes('--allow-large-shrink'),
  });
  process.exitCode = exitCode;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ error: String(error) }));
    process.exitCode = 1;
  });
}
