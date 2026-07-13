import { revalidatePath } from 'next/cache';
import { sendTransferSyncCheckIn } from '@/lib/monitoring/check-in';
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

function revalidateTransferPaths() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/about');
    revalidatePath('/subjects');
    revalidatePath('/organizations');
    revalidatePath('/levels');
    revalidatePath('/courses');
    revalidatePath('/sitemap.xml');
  } catch {
    // revalidatePath only works inside a Next.js request context
  }
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

  const startedAt = Date.now();
  const result = await runTransferSync();
  const durationMs = Date.now() - startedAt;

  if (result.action === 'error') {
    return Response.json(result, { status: 500 });
  }

  try {
    await sendTransferSyncCheckIn({
      durationMs,
      result: {
        action: result.action,
        ...(result.action === 'skipped' ? { reason: result.reason } : {}),
        ...(result.action === 'batch' || result.action === 'promoted'
          ? {
              processed: result.processed,
              imported: result.imported,
              expected: result.expected,
            }
          : {}),
        ...(result.action === 'batch' ? { cursor: result.cursor } : {}),
      },
    });
  } catch {
    // Check-in is best-effort; never convert a successful sync into an HTTP error.
  }

  if (result.action === 'promoted') {
    revalidateTransferPaths();
  }

  return Response.json(result);
}
