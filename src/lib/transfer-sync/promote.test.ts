/**
 * @jest-environment node
 */

import { promoteStaging } from './promote';

const ACTIVE_SYNC_ID = '00000000-0000-4000-8000-000000000001';

function queryForPromotion(statement: string) {
  if (statement.includes('COUNT(*)::int AS count FROM transfer_courses_stage')) {
    return { rows: [{ count: 1 }] };
  }
  if (statement.includes('FROM transfer_sync_state')) {
    return {
      rows: [
        {
          id: 'transfer',
          status: 'running',
          cursor: 1,
          expected_count: 1,
          imported_count: 1,
          started_at: null,
          completed_at: null,
          next_due_at: null,
          lease_expires_at: null,
          last_error: null,
          sync_id: ACTIVE_SYNC_ID,
          failed_experience_count: 0,
        },
      ],
    };
  }
  if (statement.includes('FROM transfer_sync_items')) return { rows: [{ count: 1 }] };
  if (statement.includes('COUNT(*)::int AS count FROM transfer_courses')) {
    return { rows: [{ count: 1 }] };
  }
  if (statement.includes('FOR UPDATE') || statement.includes('RETURNING id')) {
    return { rows: [{ id: 'transfer' }] };
  }
  return { rows: [] };
}

describe('transfer promotion ownership', () => {
  it('completes the owned sync before committing the live-table replacement', async () => {
    const query = jest.fn(async (statement: string) => queryForPromotion(statement));

    await promoteStaging({ query } as never, ACTIVE_SYNC_ID);

    const statements = query.mock.calls.map(([statement]) => statement as string);
    const begin = statements.indexOf('BEGIN');
    const completion = statements.findIndex((statement) => statement.includes('completed_at = NOW()'));
    const commit = statements.indexOf('COMMIT');

    expect(statements.find((statement) => statement.includes('FOR UPDATE'))).toContain(
      'AND sync_id = $2::uuid'
    );
    expect(begin).toBeLessThan(completion);
    expect(completion).toBeLessThan(commit);
  });
});
