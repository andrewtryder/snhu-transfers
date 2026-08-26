import { drizzle } from 'drizzle-orm/node-postgres';
import { getPool } from './pool';
import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as typeof globalThis & {
  drizzleDb?: Database;
};

function createDb(): Database {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL is required to query transfer data');
  }

  return drizzle(getPool(), { schema });
}

function getDb(): Database {
  if (!globalForDb.drizzleDb) {
    globalForDb.drizzleDb = createDb();
  }

  return globalForDb.drizzleDb;
}

/**
 * Lazily create the database client. Importing a page during `next build` must
 * not require a production connection string; request-time data loaders call
 * through this proxy only after `connection()` has deferred prerendering.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = database[property];
    return typeof value === 'function' ? value.bind(database) : value;
  },
});
