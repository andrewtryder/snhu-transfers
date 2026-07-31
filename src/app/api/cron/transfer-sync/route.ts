import { revalidateTag } from 'next/cache';
import { runTransferSync } from '@/lib/transfer-sync';

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.POSTGRES_URL) {
    return Response.json(
      { error: 'Failed to connect to the database. Ensure POSTGRES_URL is set.' },
      { status: 500 }
    );
  }

  const result = await runTransferSync();

  if (result.action === 'error') {
    return Response.json(result, { status: 500 });
  }

  if (result.action === 'promoted') {
    revalidateTag('transfer-data', 'max');
  }

  return Response.json(result);
}
