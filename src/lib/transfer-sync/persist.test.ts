/**
 * @jest-environment node
 */

import { advanceCursor, markCompleted } from './persist';

const ACTIVE_SYNC_ID = '00000000-0000-4000-8000-000000000001';

function clientWithQuery(query: jest.Mock) {
  return { query } as never;
}

describe('sync ownership updates', () => {
  it('advances only the active running sync', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ id: 'transfer' }] });

    await advanceCursor(clientWithQuery(query), ACTIVE_SYNC_ID, 20, 4);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("AND sync_id = $4::uuid\n      AND status = 'running'"),
      [20, 4, 'transfer', ACTIVE_SYNC_ID]
    );
  });

  it('rejects a stale worker cursor update', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });

    await expect(advanceCursor(clientWithQuery(query), ACTIVE_SYNC_ID, 20, 4)).rejects.toThrow(
      'Transfer sync ownership lost while advancing cursor'
    );
  });

  it('completes and clears items only for the active running sync', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: 'transfer' }] })
      .mockResolvedValueOnce({ rows: [] });

    await markCompleted(clientWithQuery(query), ACTIVE_SYNC_ID);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("AND sync_id = $2::uuid\n      AND status = 'running'"),
      ['transfer', ACTIVE_SYNC_ID]
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM transfer_sync_items WHERE sync_id = $1::uuid',
      [ACTIVE_SYNC_ID]
    );
  });

  it('rejects a stale worker before clearing any snapshot items', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });

    await expect(markCompleted(clientWithQuery(query), ACTIVE_SYNC_ID)).rejects.toThrow(
      'Transfer sync ownership lost while marking completion'
    );
    expect(query).toHaveBeenCalledTimes(1);
  });
});
