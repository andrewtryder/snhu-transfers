/**
 * @jest-environment node
 */
/**
 * POST /api/revalidate
 *
 * Protected endpoint for triggering on-demand cache invalidation after a
 * successful CircleCI or desktop synchronization.
 *
 * Authentication: Bearer token in the Authorization header matching the
 * REVALIDATE_SECRET environment variable. Fails closed if the secret is unset.
 *
 * Returns a structured JSON result — never exposes credentials or connection details.
 */
import { revalidatePath, revalidateTag } from 'next/cache';

const TRANSFER_CACHE_TAG = 'transfer-data';

const REVALIDATE_PATHS = [
  '/',
  '/subjects',
  '/organizations',
  '/levels',
  '/courses',
  '/sitemap.xml',
] as const;

function isAuthorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  // Fail closed: if the secret is not configured, no request is authorized.
  if (!secret) {
    return false;
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Invalidate all functions tagged with 'transfer-data'.
  revalidateTag(TRANSFER_CACHE_TAG, 'max');

  // Also explicitly revalidate key paths to ensure ISR pages are purged.
  const revalidatedPaths: string[] = [];
  for (const path of REVALIDATE_PATHS) {
    try {
      revalidatePath(path, 'layout');
      revalidatedPaths.push(path);
    } catch {
      // revalidatePath only works inside a Next.js request context; silently
      // skip failures so the tag invalidation still takes effect.
    }
  }

  return Response.json({
    revalidated: true,
    tag: TRANSFER_CACHE_TAG,
    paths: revalidatedPaths,
    timestamp: new Date().toISOString(),
  });
}
