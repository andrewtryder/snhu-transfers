/**
 * @jest-environment node
 */

/**
 * Tests for scripts/transfer-sync.ts
 *
 * Test the exported loop directly so the process is never actually exited.
 */

jest.mock('../src/lib/transfer-sync', () => ({
  runTransferSync: jest.fn(),
}));

// Intercept dotenv so it doesn't look for a real .env file in CI.
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

import { runTransferSync } from '../src/lib/transfer-sync';
import { runToCompletion } from './transfer-sync';

const mockedRunTransferSync = runTransferSync as jest.MockedFunction<typeof runTransferSync>;

async function runScript(options: { ignoreLease?: boolean; allowLargeShrink?: boolean } = {}) {
  process.env.POSTGRES_URL = 'postgres://example';
  return runToCompletion(options);
}

describe('transfer-sync CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exits with code 1 when runTransferSync returns action: error', async () => {
    mockedRunTransferSync.mockResolvedValue({ action: 'error', error: 'db exploded' });
    await expect(runScript()).resolves.toBe(1);
  });

  it('exits with code 0 when runTransferSync returns action: skipped', async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: 'skipped',
      reason: 'not_due',
      state: {
        id: 'transfer',
        status: 'idle',
        cursor: 0,
        expected_count: null,
        imported_count: 0,
        started_at: null,
        completed_at: null,
        next_due_at: new Date('2099-01-01'),
        lease_expires_at: null,
        last_error: null,
        sync_id: null,
        failed_experience_count: 0,
      },
    });
    await expect(runScript()).resolves.toBe(0);
  });

  it('exits with code 0 when runTransferSync returns action: promoted', async () => {
    mockedRunTransferSync.mockResolvedValue({
      action: 'promoted',
      processed: 100,
      imported: 250,
      expected: 100,
      done: true,
    });
    await expect(runScript()).resolves.toBe(0);
  });

  it('loops through batch actions until promoted', async () => {
    mockedRunTransferSync
      .mockResolvedValueOnce({ action: 'batch', processed: 20, imported: 50, cursor: 20, expected: 100, done: false })
      .mockResolvedValueOnce({ action: 'batch', processed: 20, imported: 50, cursor: 40, expected: 100, done: false })
      .mockResolvedValueOnce({ action: 'promoted', processed: 60, imported: 150, expected: 100, done: true });

    const result = await runScript();

    expect(mockedRunTransferSync).toHaveBeenCalledTimes(3);
    expect(result).toBe(0);
  });

  it('passes --ignore-lease to runTransferSync', async () => {
    mockedRunTransferSync.mockResolvedValue({ action: 'skipped', reason: 'not_due', state: {
      id: 'transfer', status: 'idle', cursor: 0, expected_count: null, imported_count: 0,
      started_at: null, completed_at: null, next_due_at: null, lease_expires_at: null,
      last_error: null, sync_id: null, failed_experience_count: 0,
    }});
    await runScript({ ignoreLease: true });
    expect(mockedRunTransferSync).toHaveBeenCalledWith(
      expect.objectContaining({ ignoreLease: true })
    );
  });
});
