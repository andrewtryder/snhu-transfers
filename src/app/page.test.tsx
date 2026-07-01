import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';

jest.mock('pg', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 1,
              subjectprefix: 'GEO',
              coursenumber: 'GEO200',
              title: 'Human Geography',
              pid: 'r1XWeIg9U',
              eligibilitytimeframe: 'Ongoing',
              groupfilter2name: 'AP Exams',
              academiclevel: 'Undergraduate',
              coursepid: '5beef559ac5c642e00c11b58'
            }
          ]
        }),
        end: jest.fn().mockResolvedValue(undefined)
      }
    })
  }
});

describe('Page tests', () => {
    it('renders the page and interacts with the search and rows', async () => {
        // Page is an async Server Component, we need to await it
        const ServerComponent = await Page();
        render(ServerComponent);

        // Check if heading is present
        expect(screen.getByText('SNHU Transfer List - Sorted by subject and course - Database Integrated')).toBeInTheDocument();

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
        const searchInput = screen.getByPlaceholderText('Search courses...');
        fireEvent.change(searchInput, { target: { value: 'XYZ999' } });

        // GEO200 should not be visible anymore
        expect(screen.queryByText('GEO200')).not.toBeInTheDocument();
    });
});
