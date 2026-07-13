import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function migrate() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_courses (
        id SERIAL PRIMARY KEY,
        "subjectprefix" VARCHAR(255),
        "coursenumber" VARCHAR(255),
        title TEXT,
        pid VARCHAR(255),
        "eligibilitytimeframe" TEXT,
        "groupfilter2name" VARCHAR(255),
        "academiclevel" VARCHAR(255),
        "coursepid" VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_courses_stage (
        id SERIAL PRIMARY KEY,
        "subjectprefix" VARCHAR(255),
        "coursenumber" VARCHAR(255),
        title TEXT,
        pid VARCHAR(255),
        "eligibilitytimeframe" TEXT,
        "groupfilter2name" VARCHAR(255),
        "academiclevel" VARCHAR(255),
        "coursepid" VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_sync_state (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'idle',
        cursor INTEGER NOT NULL DEFAULT 0,
        expected_count INTEGER,
        imported_count INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        next_due_at TIMESTAMPTZ,
        lease_expires_at TIMESTAMPTZ,
        last_error TEXT
      );
    `);

    await client.query(`
      INSERT INTO transfer_sync_state (id, status, cursor, imported_count)
      VALUES ('transfer', 'idle', 0, 0)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

migrate();
