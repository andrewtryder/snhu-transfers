/** @jest-environment node */

jest.mock('next/server', () => ({ connection: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/seoQueries', () => ({
  getTransferLastModified: jest.fn(),
  getDistinctSubjects: jest.fn(),
  getDistinctOrganizations: jest.fn(),
  getDistinctLevels: jest.fn(),
  getDistinctCourseNumbers: jest.fn(),
}));

import sitemap, { getStaticSitemapRoutes } from './sitemap';
import {
  getDistinctCourseNumbers,
  getDistinctLevels,
  getDistinctOrganizations,
  getDistinctSubjects,
  getTransferLastModified,
} from '@/lib/seoQueries';

describe('sitemap', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns only the static route set when transfer data is unavailable', async () => {
    getTransferLastModified.mockRejectedValueOnce(new Error('Neon 402'));

    await expect(sitemap()).resolves.toEqual(getStaticSitemapRoutes());
  });

  it('includes dynamic dimension routes when all loaders succeed', async () => {
    getTransferLastModified.mockResolvedValueOnce(new Date('2026-01-01'));
    getDistinctSubjects.mockResolvedValueOnce(['ACC']);
    getDistinctOrganizations.mockResolvedValueOnce(['Sophia Learning']);
    getDistinctLevels.mockResolvedValueOnce(['Undergraduate']);
    getDistinctCourseNumbers.mockResolvedValueOnce(['ACC-201']);

    const urls = await sitemap();
    expect(urls.map((entry) => entry.url)).toEqual(expect.arrayContaining([
      expect.stringContaining('/subjects/acc'),
      expect.stringContaining('/organizations/sophia-learning'),
      expect.stringContaining('/levels/undergraduate'),
      expect.stringContaining('/courses/acc-201'),
    ]));
  });
});
