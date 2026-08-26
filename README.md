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
- Public read-only transfer-coverage API for bounded course-code batches
- Include basic SEO support through metadata, `robots.txt`, and `sitemap.xml`

## Transfer Coverage API

Unofficial public endpoint for checking live transfer-equivalency coverage for a
bounded list of SNHU course codes. Full contract: [docs/transfer-coverage-api.md](docs/transfer-coverage-api.md).

```bash
curl "https://snhu-transfers.vercel.app/api/v1/transfer-coverage?courses=CS110,CS210,MAT140"
```

- Maximum 100 unique course codes per request
- Returns explicit unmatched-course objects (not omissions)
- `dataLastUpdatedAt` comes from the last successful transfer sync
- Treat HTTP 503 as unavailable data, not zero coverage
- Not an official SNHU API; listings do not guarantee acceptance

## Tech Stack

- [Next.js](https://nextjs.org/) App Router
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/) for database queries
- [PostgreSQL](https://www.postgresql.org/) for transfer equivalency data (Drizzle + `pg`)
- [Vercel](https://vercel.com/) for hosting and analytics
- [Honeybadger](https://www.honeybadger.io/) for error monitoring
- [Lucide React](https://lucide.dev/) for icons

## Architecture Overview

This project is a Next.js application hosted on Vercel.

At a high level, the app is organized around a server-rendered data load from PostgreSQL, followed by a client-side search and browsing interface:

```text
src/
  app/
    api/
      revalidate/
        route.ts
      v1/
        transfer-coverage/
          route.ts
    ClientPage.tsx
    layout.tsx
    page.tsx
    robots.ts
    sitemap.ts

  db/
    index.ts
    pool.ts
    ssl.ts
    client.ts
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
2. On refresh start, experience PIDs are snapshotted into `transfer_sync_items`. Later sync resumes from that immutable list instead of re-downloading and re-slicing the live Kuali response. The previous successful `completed_at` timestamp is preserved until promote finishes.
3. Course mappings are parsed from the experience achievement criteria using SNHU course codes (e.g. `CS499`) as the cross-project identifier.
4. Rows are written to `transfer_courses_stage`. A failed experience-detail fetch fails the batch without advancing the cursor (successful details with zero mappings are valid and contribute zero rows).
5. When the snapshot cursor reaches `expected_count`, staging is validated and atomically promoted into `transfer_courses`. Promote requires `cursor === expected_count`, `failed_experience_count === 0`, matching snapshot size, nonempty staging, and that staging is at least 75% of the current live row count (bootstrap can pass `--allow-large-shrink` to override).
6. The homepage and landing pages load from `transfer_courses` only (no catalog join required).
7. The client UI lets users search, group, and expand transfer equivalency results.
8. After a successful promote, the external sync environment calls `POST /api/revalidate` to invalidate the `transfer-data` cache tag.

## Local Development

Install dependencies:

```bash
npm install
```

Create a `.env` file (see `.env.example`). For local Aiven development, you can keep
provider-specific values in a Git-ignored `.env.aiven.local` and set:

```bash
POSTGRES_URL=postgresql://...
POSTGRES_CA_CERT=.aiven/ca.pem
REVALIDATE_SECRET=your-random-revalidation-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COURSES_URL=https://snhu-courses.vercel.app
HONEYBADGER_API_KEY=
NEXT_PUBLIC_HONEYBADGER_API_KEY=
```

The runtime uses a small shared `pg` pool (`max: 1`) with Vercel
`attachDatabasePool()` for lifecycle cleanup. Migration, bootstrap, and sync scripts
use direct `pg.Client` connections with the same verified TLS configuration via
`POSTGRES_CA_CERT` (filesystem path locally, inline PEM on Vercel).

Optional `coursePID` enrichment during promotion looks up catalog PIDs from a same-database
`catalog_course_lookup` view when available. On isolated Aiven databases this step is
skipped with a controlled warning and does not block promotion.

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
- `npm run transfer:sync` - Run an incremental transfer refresh to completion. Pass `-- --ignore-lease` only to deliberately take over an expired/stuck lease, or `-- --allow-large-shrink` only after reviewing an intentional large data reduction.

## Deployment

The site can deploy on Vercel, but the preferred quota-conscious update model is a weekly CircleCI job (or a trusted desktop machine). Those environments run the full sync to completion without consuming Vercel function time.

Set the following environment variables in the site deployment and in the trusted sync environment as applicable:

- `POSTGRES_URL` (required PostgreSQL connection URL for runtime queries, migration, bootstrap, and sync)
- `POSTGRES_CA_CERT` (optional verified TLS CA — local path such as `.aiven/ca.pem` or inline PEM on Vercel)
- `REVALIDATE_SECRET` (required by the external cache-revalidation endpoint)
- `NEXT_PUBLIC_SITE_URL` (optional — defaults to `https://snhu-transfers.vercel.app`)
- `NEXT_PUBLIC_COURSES_URL` (optional — enables "View prerequisites" links)
- `HONEYBADGER_API_KEY` (server-side error reporting)
- `NEXT_PUBLIC_HONEYBADGER_API_KEY` (optional — browser/error-boundary reporting; the app builds and runs when unset)

### Database configuration & environment isolation

The database client intentionally fails fast if `POSTGRES_URL` is missing at query time. For Vercel Preview deployments to access transfer equivalency data and directory pages, `POSTGRES_URL` must be configured in Vercel project settings for the **Preview** environment as well as **Production**.

- **Fix via Vercel configuration**: Missing database connectivity in Preview must be resolved via Vercel environment variable settings, not through code fallbacks or mock data.
- **Preferred Preview isolation**: Configure branch-scoped Preview `POSTGRES_URL` values when validating against non-production databases.


### External weekly synchronization

On a trusted machine or CircleCI, keep `POSTGRES_URL` and `REVALIDATE_SECRET` in its encrypted secret store. Do not print either value in CI logs. After installing dependencies, run:

```bash
npm run db:migrate
npm run transfer:sync
curl --fail --request POST "$SITE_URL/api/revalidate" \
  --header "Authorization: Bearer $REVALIDATE_SECRET"
```

`transfer:sync` preserves the existing lease, staging validation, 25% shrink guard, and atomic promotion. Schedule it weekly in CircleCI with pipeline parameter `run_transfer_sync=true` on `master` (default `false` so ordinary pushes do not sync). Invoke the revalidation endpoint only after a successful promotion. `POST /api/revalidate` fails closed when `REVALIDATE_SECRET` is absent or the bearer token is invalid; it invalidates the `transfer-data` cache tag. Transfer refresh is independent of the course catalog sync.

Also configure a Vercel Firewall rate limit for `GET /api/v1/transfer-coverage` (dashboard; not in-repo).

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
