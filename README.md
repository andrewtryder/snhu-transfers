# SNHU Transfer Equivalency List

An unofficial transfer credit lookup tool for Southern New Hampshire University students.

The SNHU Transfer Equivalency List helps students search and browse transfer credit equivalencies from providers such as AP Exams, Sophia Learning, Study.com, and other organizations. It is designed to make it easier to explore which outside learning experiences may transfer into SNHU as credit while planning a degree path.

## Why This Exists

I built this site as a proud SNHU graduate who understands how valuable transfer credits can be when planning a degree.

During my time at Southern New Hampshire University, transfer credits helped shape my academic path and made it easier to move through my program efficiently. But finding and comparing transfer equivalencies can be time-consuming, especially when checking multiple providers, course codes, academic levels, and eligibility windows.

This tool was designed to give SNHU students a simpler way to explore transfer options in one searchable place. Search by course, provider, or title; browse equivalencies by subject, organization, or academic level; and use the results as a planning aid before confirming details with SNHU.

## Disclaimer

This site is unofficial and is intended for informational purposes only.

Transfer evaluations, eligibility windows, course mappings, provider offerings, and SNHU policies can change. Always confirm transfer eligibility on the official SNHU website and with your academic advisor before making academic or financial decisions.

This project is not affiliated with, endorsed by, or operated by Southern New Hampshire University.

## Related Project

I also built [SNHU Course Prerequisites Tool](https://github.com/andrewtryder/snhu-courses), another tool for SNHU students that makes it easier to search courses and visualize prerequisite relationships while planning a degree path.

## Features

- Search SNHU transfer equivalencies by course code, title, or organization
- Browse results by subject, provider organization, or academic level
- View transfer titles, eligibility timeframes, and academic levels
- Link to official SNHU transfer experience pages when available
- Refresh transfer data from SNHU's public Kuali catalog API
- Include basic SEO support through metadata, `robots.txt`, and `sitemap.xml`

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) for database queries
- [Neon](https://neon.tech/) / PostgreSQL for transfer equivalency data
- [Vercel](https://vercel.com/) for hosting, cron jobs, and analytics
- [Lucide React](https://lucide.dev/) for icons

## Architecture Overview

This project is a Next.js application hosted on Vercel.

At a high level, the app is organized around a server-rendered data load from PostgreSQL, followed by a client-side search and browsing interface:

```text
src/
  app/
    api/
      update-courses/
        route.ts
    ClientPage.tsx
    layout.tsx
    page.tsx
    robots.ts
    sitemap.ts

  db/
    index.ts
    schema.ts

scripts/
  populate.ts
  setup-db.ts
  test-update.ts
```

## How It Works

1. The update route fetches public transfer experience data from SNHU's Kuali catalog API.
2. Course mappings are parsed from the experience achievement criteria.
3. Parsed transfer equivalencies are written to PostgreSQL using Drizzle ORM.
4. The homepage loads transfer data from the database in a server component.
5. The client UI lets users search, group, and expand transfer equivalency results.
6. After a successful update, the app revalidates the homepage so fresh data can be shown.

## Local Development

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```bash
POSTGRES_URL=postgresql://...
CRON_SECRET=your-random-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Initialize the database:

```bash
npx tsx scripts/setup-db.ts
```

Populate transfer course data:

```bash
npx tsx scripts/populate.ts
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run start` - Run the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Deployment

This project is designed to deploy on Vercel.

Set the following environment variables in Vercel:

- `POSTGRES_URL`
- `CRON_SECRET`
- `NEXT_PUBLIC_BASE_URL`

The project includes a Vercel cron job that refreshes transfer data monthly by calling `/api/update-courses`.

## License

This project is provided as an unofficial educational planning aid. It is not affiliated with Southern New Hampshire University.
