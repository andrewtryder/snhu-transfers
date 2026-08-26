import { Client, type ClientConfig } from 'pg';
import { resolvePgConnectionConfig } from './ssl';

export function createPgClientConfig(connectionString: string): ClientConfig {
  const { connectionString: cleanedConnectionString, ssl } =
    resolvePgConnectionConfig(connectionString);

  return {
    connectionString: cleanedConnectionString,
    ssl,
  };
}

export function createPgClient(connectionString: string): Client {
  return new Client(createPgClientConfig(connectionString));
}
