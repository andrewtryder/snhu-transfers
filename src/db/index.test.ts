/**
 * @jest-environment node
 */

const attachDatabasePoolMock = jest.fn();
const poolConstructorMock = jest.fn(function MockPool(this: { connect: jest.Mock }) {
  this.connect = jest.fn();
});

jest.mock('@vercel/functions', () => ({
  attachDatabasePool: attachDatabasePoolMock,
}));

jest.mock('pg', () => ({
  Pool: poolConstructorMock,
}));

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn((pool, options) => ({
    pool,
    options,
    select: jest.fn(),
    execute: jest.fn(),
  })),
}));

describe('db client initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    attachDatabasePoolMock.mockReset();
    poolConstructorMock.mockClear();
    process.env = { ...originalEnv };
    delete (globalThis as { pgPool?: unknown }).pgPool;
    delete (globalThis as { drizzleDb?: unknown }).drizzleDb;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not throw on import when POSTGRES_URL is unset (lazy proxy)', async () => {
    delete process.env.POSTGRES_URL;

    const { db } = await import('./index');
    expect(db).toBeDefined();
  });

  it('throws clear fail-fast error when accessing db methods and POSTGRES_URL is missing', async () => {
    delete process.env.POSTGRES_URL;

    const { db } = await import('./index');
    expect(() => {
      void db.select;
    }).toThrow('POSTGRES_URL is required to query transfer data');
  });

  it('creates one shared pool and drizzle instance when POSTGRES_URL is present', async () => {
    process.env.POSTGRES_URL = 'postgresql://user:pass@host/db';

    const { db } = await import('./index');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { POOL_OPTIONS } = await import('./pool');

    expect(db.select).toBeDefined();
    void db.execute;
    expect(poolConstructorMock).toHaveBeenCalledTimes(1);
    expect(poolConstructorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: 'postgresql://user:pass@host/db',
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000,
      })
    );
    expect(attachDatabasePoolMock).toHaveBeenCalledTimes(1);
    expect(drizzle).toHaveBeenCalledTimes(1);
    expect(POOL_OPTIONS).toEqual({
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    });
  });
});
