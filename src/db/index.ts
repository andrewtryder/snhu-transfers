import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Database = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): Database {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL is required to query transfer data');
  }

  return drizzle(neon(connectionString), { schema });
}

/**
 * Lazily create the database client. Importing a page during `next build` must
 * not require a production connection string; request-time data loaders call
 * through this proxy only after `connection()` has deferred prerendering.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = createDb() as unknown as Record<PropertyKey, unknown>;
    const value = database[property];
    return typeof value === 'function' ? value.bind(database) : value;
  },
});
