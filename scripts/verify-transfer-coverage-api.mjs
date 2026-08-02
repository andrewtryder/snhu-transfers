#!/usr/bin/env node
/**
 * Manual contract check against a running deployment or local server.
 * Does not require database credentials and never mutates data.
 *
 * Usage:
 *   node scripts/verify-transfer-coverage-api.mjs [baseUrl]
 */

const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const url = `${baseUrl}/api/v1/transfer-coverage?courses=CS110,CS210,MAT140`;

const response = await fetch(url);
const text = await response.text();

if (!response.ok) {
  console.error(`Expected HTTP 200, got ${response.status}`);
  console.error(text);
  process.exit(1);
}

let body;
try {
  body = JSON.parse(text);
} catch {
  console.error("Response was not JSON");
  console.error(text);
  process.exit(1);
}

const errors = [];

if (body.schemaVersion !== 1) {
  errors.push(`schemaVersion expected 1, got ${body.schemaVersion}`);
}

if (body.requestedCourseCount !== 3) {
  errors.push(`requestedCourseCount expected 3, got ${body.requestedCourseCount}`);
}

if (!Array.isArray(body.courses) || body.courses.length !== 3) {
  errors.push("expected exactly three course objects");
} else {
  const codes = body.courses.map((course) => course.courseCode);
  for (const expected of ["CS110", "CS210", "MAT140"]) {
    if (!codes.includes(expected)) {
      errors.push(`missing course object for ${expected}`);
    }
  }
}

if (!(typeof body.dataLastUpdatedAt === "string" || body.dataLastUpdatedAt === null)) {
  errors.push("dataLastUpdatedAt must be a string or null");
}

if (errors.length > 0) {
  console.error("Verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log("OK", {
  baseUrl,
  schemaVersion: body.schemaVersion,
  requestedCourseCount: body.requestedCourseCount,
  matchedCourseCount: body.matchedCourseCount,
  dataLastUpdatedAt: body.dataLastUpdatedAt,
  courseCodes: body.courses.map((course) => course.courseCode),
});
