import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { bootstrapTransfer } from '../src/lib/transfer-sync';

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is required');
    process.exit(1);
  }

  const result = await bootstrapTransfer();
  console.log(
    `Transfer bootstrap finished: imported ${result.imported} rows from ${result.expected} experiences`
  );
}

main().catch((error) => {
  console.error('Transfer bootstrap failed:', error);
  process.exit(1);
});
