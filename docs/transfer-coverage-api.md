# Transfer Coverage API

Unofficial, public, read-only endpoint for checking whether SNHU course codes currently have transfer equivalencies in the synchronized snhu-transfers database.

This is **not** an official SNHU API. Transfer listings are informational and do **not** guarantee acceptance by Southern New Hampshire University. Always confirm eligibility with SNHU.

## Endpoint

```http
GET /api/v1/transfer-coverage
```

Production example:

```text
https://snhu-transfers.vercel.app/api/v1/transfer-coverage?courses=CS110,CS210,MAT140
```

## Query parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `courses` | Yes | Comma-separated SNHU course codes. Maximum **100** unique values after normalization. |

Accepted input forms are normalized to the database canonical form:

- `CS110`
- `CS 110`
- `CS-110`
- `cs110`

Normalization rules: trim whitespace, uppercase, remove spaces and hyphens, deduplicate while preserving first-seen order.

## Example response

```json
{
  "schemaVersion": 1,
  "dataLastUpdatedAt": "2026-08-02T12:00:00.000Z",
  "requestedCourseCount": 3,
  "matchedCourseCount": 2,
  "courses": [
    {
      "courseCode": "CS110",
      "displayCourseCode": "CS 110",
      "hasTransferEquivalencies": true,
      "equivalencyCount": 8,
      "providerCount": 4,
      "providers": ["Sophia Learning", "Study.com"],
      "courseUrl": "https://snhu-transfers.vercel.app/courses/cs110"
    }
  ]
}
```

Unmatched requested courses are returned explicitly with `hasTransferEquivalencies: false` and zero counts so consumers can compute an accurate X-of-Y ratio.

## Field meanings

- **`schemaVersion`**: Currently `1`. Consumers should reject incompatible future versions.
- **`dataLastUpdatedAt`**: `transfer_sync_state.completed_at` for the last successfully promoted synchronization. May be `null` if no successful sync timestamp exists. A null timestamp does **not** mean every course lacks equivalencies.
- **`equivalencyCount`**: Distinct transfer experiences for the course, counted by unique `pid` when available.
- **`providers`**: Unique nonempty provider names (`groupfilter2name`), sorted alphabetically.
- **`courseUrl`**: Canonical public course page on snhu-transfers.

## Error codes

| HTTP | Code | When |
| --- | --- | --- |
| 400 | `MISSING_COURSES` | `courses` is absent or empty |
| 400 | `INVALID_COURSE_CODE` | One or more values are malformed (`invalidCourseCodes` listed) |
| 400 | `TOO_MANY_COURSES` | More than 100 unique course codes |
| 503 | `TRANSFER_DATA_UNAVAILABLE` | Database/infrastructure failure |

Treat HTTP **503** as unavailable data, **not** zero coverage. Do not interpret a transport or infrastructure failure as “no equivalencies.”

## Cache behavior

Successful responses include:

```http
Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
```

`Last-Modified` is set when `dataLastUpdatedAt` is present.

Server-side query results are tagged with `transfer-data`. After a successful transfer sync, `POST /api/revalidate` invalidates that tag so subsequent requests refresh from PostgreSQL. Error responses use `Cache-Control: no-store`.

## Schema-version policy

- `schemaVersion` is an integer.
- Version `1` is the contract documented here.
- Additive compatible fields may appear without a version bump.
- Breaking response-shape changes require a new version (path and/or `schemaVersion`).

## Safety notes

- GET only; read-only aggregates from the live `transfer_courses` table.
- Does not query staging, mutate data, or trigger synchronization.
- Does not expose internal database IDs, sync leases, or credentials.
