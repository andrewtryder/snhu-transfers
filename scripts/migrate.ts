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
        "coursenumber" VARCHAR(255) NOT NULL,
        title TEXT,
        pid VARCHAR(255) NOT NULL,
        "eligibilitytimeframe" TEXT,
        "groupfilter2name" VARCHAR(255),
        "academiclevel" VARCHAR(255),
        "coursepid" VARCHAR(255)
      );
    `);

    // Idempotent staging: one experience → one row per SNHU course code.
    // Safe because an experience has a single title/org/eligibility; duplicate
    // course links in HTML are the same equivalency, not distinct mappings.
    await client.query(`
      DELETE FROM transfer_courses_stage
      WHERE pid IS NULL OR coursenumber IS NULL;
    `);

    await client.query(`
      DELETE FROM transfer_courses_stage a
      USING transfer_courses_stage b
      WHERE a.id > b.id
        AND a.pid = b.pid
        AND a.coursenumber = b.coursenumber;
    `);

    await client.query(`
      ALTER TABLE transfer_courses_stage
        ALTER COLUMN pid SET NOT NULL,
        ALTER COLUMN coursenumber SET NOT NULL;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS transfer_courses_stage_pid_coursenumber_uidx
      ON transfer_courses_stage (pid, coursenumber);
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
        last_error TEXT,
        sync_id UUID,
        failed_experience_count INTEGER NOT NULL DEFAULT 0
      );
    `);

    await client.query(`
      ALTER TABLE transfer_sync_state
      ADD COLUMN IF NOT EXISTS sync_id UUID;
    `);

    await client.query(`
      ALTER TABLE transfer_sync_state
      ADD COLUMN IF NOT EXISTS failed_experience_count INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_sync_items (
        sync_id UUID NOT NULL,
        ordinal INTEGER NOT NULL,
        pid TEXT NOT NULL,
        PRIMARY KEY (sync_id, ordinal),
        UNIQUE (sync_id, pid)
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
