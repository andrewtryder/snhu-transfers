import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { bootstrapTransfer } from '../src/lib/transfer-sync';

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is required');
    process.exit(1);
  }

  const allowLargeShrink = process.argv.includes('--allow-large-shrink');
  if (allowLargeShrink) {
    console.warn(
      'allowLargeShrink enabled: promote may replace live data with a much smaller staging set'
    );
  }

  const result = await bootstrapTransfer({ allowLargeShrink });
  console.log(
    `Transfer bootstrap finished: imported ${result.imported} rows from ${result.expected} experiences`
  );
}

main().catch((error) => {
  console.error('Transfer bootstrap failed:', error);
  process.exit(1);
});
