/**
 * @jest-environment node
 */

import { POST } from './route';

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

import { revalidateTag } from 'next/cache';

const mockedRevalidateTag = revalidateTag as jest.MockedFunction<typeof revalidateTag>;

function makeRequest(authHeader?: string): Request {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('POST /api/revalidate', () => {
  const originalSecret = process.env.REVALIDATE_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'test-revalidate-secret';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.REVALIDATE_SECRET;
    } else {
      process.env.REVALIDATE_SECRET = originalSecret;
    }
  });

  it('returns 401 when REVALIDATE_SECRET is not set', async () => {
    delete process.env.REVALIDATE_SECRET;
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    expect(response.status).toBe(401);
    expect(mockedRevalidateTag).not.toHaveBeenCalled();
  });

  it('returns 401 when the Authorization header is missing', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
    expect(mockedRevalidateTag).not.toHaveBeenCalled();
  });

  it('returns 401 when the Authorization header has the wrong secret', async () => {
    const response = await POST(makeRequest('Bearer wrong-secret'));
    expect(response.status).toBe(401);
    expect(mockedRevalidateTag).not.toHaveBeenCalled();
  });

  it('returns 401 when the Authorization header has the wrong scheme', async () => {
    const response = await POST(makeRequest('Basic test-revalidate-secret'));
    expect(response.status).toBe(401);
    expect(mockedRevalidateTag).not.toHaveBeenCalled();
  });

  it('revalidates the transfer-data tag on a valid request with max profile', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    expect(response.status).toBe(200);
    expect(mockedRevalidateTag).toHaveBeenCalledWith('transfer-data', 'max');
  });

  it('returns structured JSON with revalidated=true on success without paths', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    const body = await response.json();
    expect(body).toEqual({
      revalidated: true,
      tag: 'transfer-data',
      timestamp: expect.any(String),
    });
    expect(body.paths).toBeUndefined();
  });

  it('never exposes secrets in the response body', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    const text = await response.text();
    expect(text).not.toContain('test-revalidate-secret');
    expect(text).not.toContain('REVALIDATE_SECRET');
  });
});
