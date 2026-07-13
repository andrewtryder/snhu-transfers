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

Optional course pages can link to that app for prerequisite details via `NEXT_PUBLIC_COURSES_URL`. The transfer site does not require the courses app to be running, and sync does not call it over HTTP or join its tables for core pages.

## Features

- Search SNHU transfer equivalencies by course code, title, or organization
- Browse results by subject, provider organization, or academic level
- View transfer titles, eligibility timeframes, and academic levels
- Link to official SNHU transfer experience pages when available
- Optional deep links to course prerequisite pages
- Refresh transfer data from SNHU's public Kuali transfer-experience API
- Include basic SEO support through metadata, `robots.txt`, and `sitemap.xml`

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) for database queries
- [Neon](https://neon.tech/) / PostgreSQL for transfer equivalency data
- [Vercel](https://vercel.com/) for hosting, cron jobs, and analytics
- [Honeybadger](https://www.honeybadger.io/) for error monitoring
- [Lucide React](https://lucide.dev/) for icons

## Architecture Overview

This project is a Next.js application hosted on Vercel.

At a high level, the app is organized around a server-rendered data load from PostgreSQL, followed by a client-side search and browsing interface:

```text
src/
  app/
    api/
      cron/
        transfer-sync/
          route.ts
    ClientPage.tsx
    layout.tsx
    page.tsx
    robots.ts
    sitemap.ts

  db/
    index.ts
    schema.ts

  lib/
    transfer-sync/
      index.ts
      fetch.ts
      parse.ts
      persist.ts
      promote.ts

scripts/
  migrate.ts
  transfer-bootstrap.ts
```

## How It Works

1. Transfer sync fetches public transfer experience data from SNHU's Kuali API (experiences only — not the full course catalog).
2. On refresh start, experience PIDs are snapshotted into `transfer_sync_items`. Later cron ticks resume from that immutable list instead of re-downloading and re-slicing the live Kuali response.
3. Course mappings are parsed from the experience achievement criteria using SNHU course codes (e.g. `CS499`) as the cross-project identifier.
4. Rows are written to `transfer_courses_stage`. A failed experience-detail fetch fails the batch without advancing the cursor (successful details with zero mappings are valid and contribute zero rows).
5. When the snapshot cursor reaches `expected_count`, staging is validated and atomically promoted into `transfer_courses`. Promote requires `cursor === expected_count`, `failed_experience_count === 0`, matching snapshot size, nonempty staging, and that staging is at least 75% of the current live row count (bootstrap can pass `--allow-large-shrink` to override).
6. The homepage and landing pages load from `transfer_courses` only (no catalog join required).
7. The client UI lets users search, group, and expand transfer equivalency results.
8. After a successful promote, the cron route revalidates cached pages.

## Local Development

Install dependencies:

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```bash
POSTGRES_URL=postgresql://...
CRON_SECRET=your-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COURSES_URL=https://snhu-courses.vercel.app
HONEYBADGER_API_KEY=
NEXT_PUBLIC_HONEYBADGER_API_KEY=
```

Initialize the database:

```bash
npm run db:migrate
```

Populate transfer course data:

```bash
npm run transfer:bootstrap
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
- `npm run db:migrate` - Create transfer tables and sync state (idempotent)
- `npm run transfer:bootstrap` - Full local transfer sync into staging, then promote (`--allow-large-shrink` overrides the 25% live shrink guard)

## Deployment

This project is designed to deploy on Vercel.

Set the following environment variables in Vercel **Production**:

- `POSTGRES_URL`
- `CRON_SECRET` (required — the cron route fails closed if unset)
- `NEXT_PUBLIC_SITE_URL` (optional — defaults to `https://snhu-transfers.vercel.app`)
- `NEXT_PUBLIC_COURSES_URL` (optional — enables "View prerequisites" links)
- `HONEYBADGER_API_KEY` (server-side error reporting)
- `NEXT_PUBLIC_HONEYBADGER_API_KEY` (optional — browser/error-boundary reporting; the app builds and runs when unset)

The project includes a daily Vercel cron job at `/api/cron/transfer-sync` (`17 5 * * *`). A successful promote sets `next_due_at` seven days later, so most daily ticks return immediately; when due, the worker starts a refresh and continues it on subsequent days until all batches finish. Transfer refresh is independent of the course catalog sync.

## Error monitoring (Honeybadger)

- **Server errors** are reported with `HONEYBADGER_API_KEY` (never expose this key to the browser or through `next.config` `env`).
- **Browser / App Router error UI** reporting is optional via `NEXT_PUBLIC_HONEYBADGER_API_KEY`.
- Caught transfer-sync failures (which would otherwise become `{ action: "error" }` results) notify Honeybadger once from the sync library with safe job context and tags `cron` / `transfer-sync`.
- Source map uploading is intentionally disabled (`disableSourceMapUpload: true`).
- Honeybadger skips reporting in development and test environments by default.

### Safely testing reporting

Do not add a permanently public failure route. Prefer one of:

1. From a machine with Production env loaded (never commit secrets):

```bash
npx tsx -e "
import { reportServerError } from './src/lib/monitoring/honeybadger.ts';
await reportServerError(new Error('Honeybadger test from snhu-transfers'));
console.log('notified');
"
```

2. Use Honeybadger’s project UI to send a test notice after keys are configured.

## License

This project is provided as an unofficial educational planning aid. It is not affiliated with Southern New Hampshire University.
