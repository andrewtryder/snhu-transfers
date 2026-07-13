import type { Client } from 'pg';
import { abortToIdle, countSyncItems, getSyncState, markCompleted } from './persist';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export async function validateStaging(client: Client): Promise<ValidationResult> {
  const errors: string[] = [];

  const countResult = await client.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM transfer_courses_stage'
  );
  const stageCount = Number(countResult.rows[0]?.count ?? 0);

  if (stageCount === 0) {
    errors.push('transfer_courses_stage is empty');
  }

  const state = await getSyncState(client);
  if (!state.sync_id) {
    errors.push('transfer_sync_state.sync_id is missing');
  } else {
    const snapshotCount = await countSyncItems(client, state.sync_id);
    const expected = state.expected_count;
    if (expected === null) {
      errors.push('transfer_sync_state.expected_count is missing');
    } else if (snapshotCount !== expected) {
      errors.push(
        `transfer_sync_items count (${snapshotCount}) !== expected_count (${expected})`
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Atomically replace live transfer_courses from staging.
 */
export async function promoteStaging(client: Client): Promise<void> {
  const validation = await validateStaging(client);
  if (!validation.ok) {
    const message = `Validation failed: ${validation.errors.join('; ')}`;
    await abortToIdle(client, message);
    throw new Error(message);
  }

  try {
    await client.query('BEGIN');

    await client.query('TRUNCATE transfer_courses');
    await client.query(`
      INSERT INTO transfer_courses (
        subjectprefix,
        coursenumber,
        title,
        pid,
        eligibilitytimeframe,
        groupfilter2name,
        academiclevel,
        coursepid
      )
      SELECT
        subjectprefix,
        coursenumber,
        title,
        pid,
        eligibilitytimeframe,
        groupfilter2name,
        academiclevel,
        coursepid
      FROM transfer_courses_stage
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  await enrichCoursePids(client);
  await markCompleted(client);
}

/**
 * Best-effort: fill coursepid from shared catalog_course_lookup when available.
 * Missing view or lookup misses leave transfer rows valid.
 */
async function enrichCoursePids(client: Client): Promise<void> {
  try {
    await client.query(`
      UPDATE transfer_courses tc
      SET coursepid = lookup.pid
      FROM catalog_course_lookup lookup
      WHERE lookup.course_code = tc.coursenumber
    `);
  } catch (error) {
    console.warn(
      'Optional coursePID enrichment skipped (catalog_course_lookup unavailable):',
      error instanceof Error ? error.message : error
    );
  }
}
