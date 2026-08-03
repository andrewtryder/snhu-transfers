import { readFileSync } from "node:fs";

const allowedActions = new Set(["promoted", "skipped", "error", "batch"]);

function fail(message) {
  console.error(`Invalid transfer synchronization result: ${message}`);
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) fail("a JSON file path is required");

let result;
try {
  result = JSON.parse(readFileSync(filePath, "utf8"));
} catch {
  fail("file is missing or does not contain valid JSON");
}

if (!result || typeof result !== "object" || Array.isArray(result)) {
  fail("result must be a JSON object");
}

if (typeof result.action !== "string" || !allowedActions.has(result.action)) {
  fail("action must be one of promoted, skipped, error, or batch");
}

if (result.action === "error") {
  fail("sync reported action=error");
}

console.log(`Transfer synchronization result is valid (${result.action}).`);
