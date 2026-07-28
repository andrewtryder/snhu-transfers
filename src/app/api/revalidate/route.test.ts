/**
 * @jest-environment node
 */

import { POST } from './route';

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

import { revalidateTag, revalidatePath } from 'next/cache';

const mockedRevalidateTag = revalidateTag as jest.MockedFunction<typeof revalidateTag>;
const mockedRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

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

  it('revalidates the transfer-data tag on a valid request', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    expect(response.status).toBe(200);
    expect(mockedRevalidateTag).toHaveBeenCalledWith('transfer-data', 'max');
  });

  it('calls revalidatePath for key paths on a valid request', async () => {
    await POST(makeRequest('Bearer test-revalidate-secret'));
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/subjects', 'layout');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/organizations', 'layout');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/levels', 'layout');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/courses', 'layout');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/sitemap.xml', 'layout');
  });

  it('returns structured JSON with revalidated=true on success', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    const body = await response.json();
    expect(body).toMatchObject({
      revalidated: true,
      tag: 'transfer-data',
      paths: expect.any(Array),
      timestamp: expect.any(String),
    });
    expect(Array.isArray(body.paths)).toBe(true);
  });

  it('never exposes secrets in the response body', async () => {
    const response = await POST(makeRequest('Bearer test-revalidate-secret'));
    const text = await response.text();
    expect(text).not.toContain('test-revalidate-secret');
    expect(text).not.toContain('REVALIDATE_SECRET');
  });
});
