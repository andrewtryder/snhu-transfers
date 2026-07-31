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
import { revalidateTag } from 'next/cache';

const TRANSFER_CACHE_TAG = 'transfer-data';

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

  return Response.json({
    revalidated: true,
    tag: TRANSFER_CACHE_TAG,
    timestamp: new Date().toISOString(),
  });
}
