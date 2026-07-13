import type { Client } from 'pg';
import type { ParsedTransferCourse } from './parse';

export const TRANSFER_SYNC_ID = 'transfer';

export type SyncStatus = 'idle' | 'running';

export interface TransferSyncState {
  id: string;
  status: SyncStatus;
  cursor: number;
  expected_count: number | null;
  imported_count: number;
  started_at: Date | null;
  completed_at: Date | null;
  next_due_at: Date | null;
  lease_expires_at: Date | null;
  last_error: string | null;
}

function asDate(value: unknown): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value));
}

export async function getSyncState(client: Client): Promise<TransferSyncState> {
  const result = await client.query(
    `SELECT
      id,
      status,
      cursor,
      expected_count,
      imported_count,
      started_at,
      completed_at,
      next_due_at,
      lease_expires_at,
      last_error
    FROM transfer_sync_state
    WHERE id = $1`,
    [TRANSFER_SYNC_ID]
  );

  if (result.rows.length === 0) {
    throw new Error('transfer_sync_state row missing; run db:migrate first');
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    status: row.status as SyncStatus,
    cursor: Number(row.cursor),
    expected_count: row.expected_count === null ? null : Number(row.expected_count),
    imported_count: Number(row.imported_count),
    started_at: asDate(row.started_at),
    completed_at: asDate(row.completed_at),
    next_due_at: asDate(row.next_due_at),
    lease_expires_at: asDate(row.lease_expires_at),
    last_error: (row.last_error as string) ?? null,
  };
}

export function isLeaseActive(state: TransferSyncState, now = new Date()): boolean {
  return state.lease_expires_at !== null && state.lease_expires_at > now;
}

export async function clearStaging(client: Client): Promise<void> {
  await client.query('TRUNCATE transfer_courses_stage');
}

export async function startRefresh(client: Client, expectedCount: number): Promise<void> {
  await clearStaging(client);
  await client.query(
    `UPDATE transfer_sync_state
    SET
      status = 'running',
      cursor = 0,
      expected_count = $1,
      imported_count = 0,
      started_at = NOW(),
      completed_at = NULL,
      lease_expires_at = NOW() + INTERVAL '5 minutes',
      last_error = NULL
    WHERE id = $2`,
    [expectedCount, TRANSFER_SYNC_ID]
  );
}

export async function refreshLease(client: Client): Promise<void> {
  await client.query(
    `UPDATE transfer_sync_state
    SET lease_expires_at = NOW() + INTERVAL '5 minutes'
    WHERE id = $1`,
    [TRANSFER_SYNC_ID]
  );
}

export async function setSyncError(client: Client, error: string): Promise<void> {
  await client.query(
    `UPDATE transfer_sync_state
    SET last_error = $1
    WHERE id = $2`,
    [error, TRANSFER_SYNC_ID]
  );
}

export async function abortToIdle(client: Client, error: string): Promise<void> {
  await client.query(
    `UPDATE transfer_sync_state
    SET
      status = 'idle',
      lease_expires_at = NULL,
      last_error = $1
    WHERE id = $2`,
    [error, TRANSFER_SYNC_ID]
  );
}

export async function insertStagedTransfer(
  client: Client,
  course: ParsedTransferCourse
): Promise<void> {
  await client.query(
    `INSERT INTO transfer_courses_stage (
      subjectprefix,
      coursenumber,
      title,
      pid,
      eligibilitytimeframe,
      groupfilter2name,
      academiclevel,
      coursepid
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      course.subjectPrefix,
      course.courseNumber,
      course.title,
      course.pid,
      course.eligibilityTimeframe,
      course.groupFilter2Name,
      course.academicLevel,
      course.coursePID,
    ]
  );
}

export async function advanceCursor(
  client: Client,
  newCursor: number,
  importedDelta: number
): Promise<void> {
  await client.query(
    `UPDATE transfer_sync_state
    SET
      cursor = $1,
      imported_count = imported_count + $2,
      lease_expires_at = NOW() + INTERVAL '5 minutes'
    WHERE id = $3`,
    [newCursor, importedDelta, TRANSFER_SYNC_ID]
  );
}

export async function markCompleted(client: Client): Promise<void> {
  await client.query(
    `UPDATE transfer_sync_state
    SET
      status = 'idle',
      completed_at = NOW(),
      next_due_at = NOW() + INTERVAL '7 days',
      lease_expires_at = NULL,
      last_error = NULL
    WHERE id = $1`,
    [TRANSFER_SYNC_ID]
  );
}
