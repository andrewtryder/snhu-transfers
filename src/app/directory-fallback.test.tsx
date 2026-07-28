import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import CoursesDirectoryPage from './courses/page';
import SubjectsDirectoryPage from './subjects/page';
import OrganizationsDirectoryPage from './organizations/page';
import LevelsDirectoryPage from './levels/page';
import {
  getCourseDirectoryEntries,
  getLevelDirectoryEntries,
  getOrganizationDirectoryEntries,
  getSubjectDirectoryEntries,
} from '@/lib/seoQueries';

jest.mock('next/server', () => ({ connection: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/seoQueries', () => ({
  getCourseDirectoryEntries: jest.fn(),
  getSubjectDirectoryEntries: jest.fn(),
  getOrganizationDirectoryEntries: jest.fn(),
  getLevelDirectoryEntries: jest.fn(),
}));

const cases = [
  ['courses', CoursesDirectoryPage, getCourseDirectoryEntries, /Transfer courses are temporarily unavailable/i],
  ['subjects', SubjectsDirectoryPage, getSubjectDirectoryEntries, /Transfer subjects are temporarily unavailable/i],
  ['organizations', OrganizationsDirectoryPage, getOrganizationDirectoryEntries, /Transfer organizations are temporarily unavailable/i],
  ['levels', LevelsDirectoryPage, getLevelDirectoryEntries, /Transfer academic levels are temporarily unavailable/i],
] as const;

describe('directory database fallbacks', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(cases)('renders a safe unavailable state for %s', async (_name, Page, loader, message) => {
    (loader as jest.Mock).mockRejectedValueOnce(new Error('Neon 402'));
    render(await Page());

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
