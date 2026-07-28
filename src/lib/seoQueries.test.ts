/**
 * @jest-environment node
 */

/**
 * Unit tests for seoQueries.ts
 *
 * All database calls are mocked. These tests verify:
 * 1. buildFacetSummaries is a pure function — zero DB calls.
 * 2. Homepage payload generation invokes the row loader exactly once.
 * 3. Distinct loaders return sorted, unique values (deduplication in SQL).
 * 4. Slug resolution maps are used for O(1) lookups.
 */

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn(<T extends (...args: unknown[]) => unknown>(fn: T) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

jest.mock('@/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

jest.mock('@/lib/transfer-sync/persist', () => ({
  TRANSFER_SYNC_ID: 'transfer',
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import type { TransferRow } from './seoQueries';
import {
  buildFacetSummaries,
  getAllTransferRows,
  getDistinctCourseNumbers,
  getDistinctLevels,
  getDistinctOrganizations,
  getDistinctSubjects,
  resolveSubjectBySlug,
} from './seoQueries';
import { db } from '@/db';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRow(partial: Partial<TransferRow> = {}): TransferRow {
  return {
    subjectPrefix: null,
    courseNumber: null,
    title: null,
    pid: null,
    eligibilityTimeframe: null,
    groupFilter2Name: null,
    academicLevel: null,
    coursePID: null,
    ...partial,
  };
}

const SAMPLE_ROWS: TransferRow[] = [
  makeRow({ subjectPrefix: 'ACC', courseNumber: 'ACC-201', groupFilter2Name: 'Sophia Learning', academicLevel: 'Undergraduate' }),
  makeRow({ subjectPrefix: 'ACC', courseNumber: 'ACC-201', groupFilter2Name: 'Study.com', academicLevel: 'Undergraduate' }),
  makeRow({ subjectPrefix: 'ACC', courseNumber: 'ACC-201', groupFilter2Name: 'Sophia Learning', academicLevel: 'Undergraduate' }),
  makeRow({ subjectPrefix: 'ENG', courseNumber: 'ENG-122', groupFilter2Name: 'AP Exams', academicLevel: 'Undergraduate' }),
  makeRow({ subjectPrefix: 'ENG', courseNumber: 'ENG-122', groupFilter2Name: 'AP Exams', academicLevel: 'Undergraduate' }),
  makeRow({ subjectPrefix: 'MAT', courseNumber: 'MAT-240', groupFilter2Name: 'Sophia Learning', academicLevel: 'Graduate' }),
];

// ── buildFacetSummaries ───────────────────────────────────────────────────────

describe('buildFacetSummaries', () => {
  it('is a pure function — does not call the database', () => {
    const callsBefore = (db.select as jest.Mock).mock.calls.length;

    buildFacetSummaries(SAMPLE_ROWS, 20);

    expect((db.select as jest.Mock).mock.calls.length).toBe(callsBefore);
  });

  it('counts occurrences correctly', () => {
    const { subjects, organizations, levels, courses } = buildFacetSummaries(SAMPLE_ROWS, 20);

    // Sophia Learning appears 3× (ACC ×2, MAT ×1)
    expect(organizations.find((f) => f.value === 'Sophia Learning')?.count).toBe(3);
    // AP Exams appears 2×
    expect(organizations.find((f) => f.value === 'AP Exams')?.count).toBe(2);
    // Study.com appears 1×
    expect(organizations.find((f) => f.value === 'Study.com')?.count).toBe(1);

    expect(subjects.find((f) => f.value === 'ACC')?.count).toBe(3);
    expect(subjects.find((f) => f.value === 'ENG')?.count).toBe(2);
    expect(subjects.find((f) => f.value === 'MAT')?.count).toBe(1);

    expect(courses.find((f) => f.value === 'ACC-201')?.count).toBe(3);
    expect(levels.find((f) => f.value === 'Undergraduate')?.count).toBe(5);
    expect(levels.find((f) => f.value === 'Graduate')?.count).toBe(1);
  });

  it('sorts by count descending, then alphabetically', () => {
    const { organizations } = buildFacetSummaries(SAMPLE_ROWS, 20);
    expect(organizations[0].value).toBe('Sophia Learning');
    expect(organizations[1].value).toBe('AP Exams');
    expect(organizations[2].value).toBe('Study.com');
  });

  it('respects the limit parameter', () => {
    const { subjects } = buildFacetSummaries(SAMPLE_ROWS, 2);
    expect(subjects).toHaveLength(2);
  });

  it('ignores null and blank values', () => {
    const rows = [
      makeRow({ subjectPrefix: null }),
      makeRow({ subjectPrefix: '  ' }),
      makeRow({ subjectPrefix: 'CS' }),
    ];
    const { subjects } = buildFacetSummaries(rows, 20);
    expect(subjects).toHaveLength(1);
    expect(subjects[0].value).toBe('CS');
  });

  it('attaches a slug to each facet', () => {
    const { organizations } = buildFacetSummaries(SAMPLE_ROWS, 20);
    expect(organizations.find((f) => f.value === 'Sophia Learning')?.slug).toBe('sophia-learning');
    expect(organizations.find((f) => f.value === 'AP Exams')?.slug).toBe('ap-exams');
  });

  it('returns empty arrays for empty input', () => {
    const result = buildFacetSummaries([], 20);
    expect(result.subjects).toHaveLength(0);
    expect(result.organizations).toHaveLength(0);
    expect(result.levels).toHaveLength(0);
    expect(result.courses).toHaveLength(0);
  });
});

// ── Homepage payload — single row load ────────────────────────────────────────

describe('getHomepagePayload (via page.tsx pattern)', () => {
  it('calls getAllTransferRows exactly once and derives facets without a second DB call', async () => {
    const mockRows: TransferRow[] = [
      makeRow({ subjectPrefix: 'GEO', courseNumber: 'GEO-200', groupFilter2Name: 'AP Exams', academicLevel: 'Undergraduate' }),
    ];

    // Reset and configure the mock
    (db.select as jest.Mock).mockClear();
    (db.from as jest.Mock).mockClear();
    (db.orderBy as jest.Mock).mockClear();
    (db.orderBy as jest.Mock).mockResolvedValue(mockRows);

    // Simulate what page.tsx does: load rows once, build facets from them
    const rows = await getAllTransferRows();
    const callsAfterLoad = (db.select as jest.Mock).mock.calls.length;

    const facets = buildFacetSummaries(rows, 20);

    // buildFacetSummaries must not trigger any additional DB calls
    expect((db.select as jest.Mock).mock.calls.length).toBe(callsAfterLoad);
    expect(facets.subjects[0].value).toBe('GEO');
    expect(facets.organizations[0].value).toBe('AP Exams');
  });
});

describe('distinct SQL loaders', () => {
  beforeEach(() => {
    (db.execute as jest.Mock).mockReset();
  });

  it.each([
    ['subjects', getDistinctSubjects, [{ value: 'ACC' }, { value: 'ENG' }]],
    ['organizations', getDistinctOrganizations, [{ value: 'AP Exams' }, { value: 'Sophia Learning' }]],
    ['levels', getDistinctLevels, [{ value: 'Graduate' }, { value: 'Undergraduate' }]],
    ['course numbers', getDistinctCourseNumbers, [{ value: 'ACC-201' }, { value: 'ENG-122' }]],
  ])('returns the sorted unique %s supplied by PostgreSQL', async (_name, loader, rows) => {
    (db.execute as jest.Mock).mockResolvedValue({ rows });

    await expect(loader()).resolves.toEqual(rows.map((row) => row.value));
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('resolves a normalized subject slug from the cached dimension map', async () => {
    (db.execute as jest.Mock).mockResolvedValue({ rows: [{ value: 'Computer Science' }] });

    await expect(resolveSubjectBySlug('COMPUTER-SCIENCE')).resolves.toBe('Computer Science');
  });
});

describe('cached loader errors', () => {
  it('propagates database failures instead of caching an empty transfer dataset', async () => {
    (db.orderBy as jest.Mock).mockRejectedValueOnce(new Error('Neon 402'));

    await expect(getAllTransferRows()).rejects.toThrow('Neon 402');
  });
});

// ── Slug generation ───────────────────────────────────────────────────────────

describe('buildFacetSummaries slug generation', () => {
  it('generates URL-safe slugs', () => {
    const rows = [
      makeRow({ groupFilter2Name: 'Sophia Learning' }),
      makeRow({ groupFilter2Name: 'AP Exams' }),
      makeRow({ groupFilter2Name: 'Study.com' }),
    ];
    const { organizations } = buildFacetSummaries(rows, 20);
    const slugs = organizations.map((o) => o.slug);
    expect(slugs).toContain('sophia-learning');
    expect(slugs).toContain('ap-exams');
    expect(slugs).toContain('study-com');
  });
});
