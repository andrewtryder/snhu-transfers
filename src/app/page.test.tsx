import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue([
      {
        id: 1,
        subjectPrefix: 'GEO',
        courseNumber: 'GEO200',
        title: 'Human Geography',
        pid: 'r1XWeIg9U',
        eligibilityTimeframe: 'Ongoing',
        groupFilter2Name: 'AP Exams',
        academicLevel: 'Undergraduate',
        coursePID: '5beef559ac5c642e00c11b58'
      }
    ])
  }
}));

describe('Page tests', () => {
    it('renders the page and interacts with the search and rows', async () => {
        // Page is an async Server Component, we need to await it
        const ServerComponent = await Page();
        render(ServerComponent);

        // Check if header branding is present
        expect(screen.getByLabelText('SNHU Transfer Equivalency List home')).toBeInTheDocument();

        // Wait for course to appear (since it's loaded from our mock)
        await waitFor(() => {
            expect(screen.getByText('GEO200')).toBeInTheDocument();
        });

        // Click row to expand
        fireEvent.click(screen.getByText('GEO200'));

        // Check if details are shown
        expect(screen.getByText('Human Geography')).toBeInTheDocument();
        expect(screen.getByText('AP Exams')).toBeInTheDocument();

        // Search for non-existent course
        const searchInput = screen.getByPlaceholderText('Search by course, title, or organization...');
        fireEvent.change(searchInput, { target: { value: 'XYZ999' } });

        // GEO200 should not be visible anymore
        expect(screen.queryByText('GEO200')).not.toBeInTheDocument();
    });
});
