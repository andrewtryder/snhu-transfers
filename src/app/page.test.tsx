import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from './page'

// Mock the JSON data so we have a predictable test environment
jest.mock('../data/courses.json', () => ({
  "IT": {
    "IT100": [
      {
        "title": "Intro to IT",
        "pid": "test-pid-1",
        "eligibilityTimeframe": "Ongoing",
        "groupFilter2Name": "Test Org",
        "academicLevel": "Undergraduate",
        "coursePID": "course-pid-1",
        "courseName": "IT100"
      }
    ]
  },
  "ENG": {
    "ENG101": [
      {
        "title": "English Comp 1",
        "pid": "test-pid-2",
        "eligibilityTimeframe": "Ongoing",
        "groupFilter2Name": "Another Org",
        "academicLevel": "Undergraduate",
        "coursePID": "course-pid-2",
        "courseName": "ENG101"
      },
      {
        "title": "English Comp 1 Alternate",
        "pid": "test-pid-3",
        "eligibilityTimeframe": "Ongoing",
        "groupFilter2Name": "Third Org",
        "academicLevel": "Undergraduate",
        "coursePID": "course-pid-3",
        "courseName": "ENG101"
      }
    ]
  }
}));

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', {
      name: /SNHU Transfer List - Sorted by subject and course/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('renders the table headers correctly', () => {
    render(<Home />)
    expect(screen.getByText('Course Number')).toBeInTheDocument()
    expect(screen.getByText('Organization')).toBeInTheDocument()
    expect(screen.getByText('Class Title')).toBeInTheDocument()
    expect(screen.getByText('Eligibility Timeframe')).toBeInTheDocument()
  })

  it('renders course group headers from mocked data', () => {
    render(<Home />)
    expect(screen.getByText('IT100')).toBeInTheDocument()
    expect(screen.getByText('ENG101')).toBeInTheDocument()
  })

  it('does not show course details initially', () => {
    render(<Home />)
    // We expect "Intro to IT" (the title of the IT100 course) NOT to be in the document initially
    expect(screen.queryByText('Intro to IT')).not.toBeInTheDocument()
  })

  it('toggles course details when clicking on a row', async () => {
    render(<Home />)

    // Find the row for IT100
    // Using a regex to find the cell containing 'IT100' along with the icon
    const it100Row = screen.getByText('IT100').closest('tr')
    expect(it100Row).not.toBeNull()

    // Click it to expand
    if (it100Row) fireEvent.click(it100Row)

    // Now details should be visible
    await waitFor(() => {
      expect(screen.getByText('Intro to IT')).toBeInTheDocument()
      expect(screen.getByText('Test Org')).toBeInTheDocument()
    })

    // Click it again to collapse
    if (it100Row) fireEvent.click(it100Row)

    // Details should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Intro to IT')).not.toBeInTheDocument()
    })
  })

  it('handles multiple items in a course group', async () => {
    render(<Home />)

    const eng101Row = screen.getByText('ENG101').closest('tr')
    if (eng101Row) fireEvent.click(eng101Row)

    await waitFor(() => {
      expect(screen.getByText('English Comp 1')).toBeInTheDocument()
      expect(screen.getByText('English Comp 1 Alternate')).toBeInTheDocument()
    })
  })

  it('renders the disclaimer', () => {
    render(<Home />)
    expect(screen.getByText(/This is an unofficial compilation/i)).toBeInTheDocument()
  })
})
