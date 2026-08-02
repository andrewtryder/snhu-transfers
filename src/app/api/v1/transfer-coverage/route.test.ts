/**
 * @jest-environment node
 */

jest.mock("next/cache", () => ({
  unstable_cache: jest.fn(<T extends (...args: unknown[]) => unknown>(fn: T) => fn),
  revalidateTag: jest.fn(),
}));

jest.mock("@/lib/transferCoverage", () => {
  const actual = jest.requireActual<typeof import("@/lib/transferCoverage")>(
    "@/lib/transferCoverage"
  );
  return {
    ...actual,
    getTransferCoverageResponse: jest.fn(),
  };
});

import { GET } from "./route";
import { getTransferCoverageResponse } from "@/lib/transferCoverage";
import type { TransferCoverageResponse } from "@/lib/transferCoverage";
import fixture from "./response.fixture.json";

const mockedGetTransferCoverageResponse =
  getTransferCoverageResponse as jest.MockedFunction<typeof getTransferCoverageResponse>;

function makeRequest(query: string): Request {
  return new Request(`http://localhost/api/v1/transfer-coverage${query}`);
}

const successBody: TransferCoverageResponse = {
  schemaVersion: 1,
  dataLastUpdatedAt: "2026-08-02T12:00:00.000Z",
  requestedCourseCount: 3,
  matchedCourseCount: 2,
  courses: [
    {
      courseCode: "CS110",
      displayCourseCode: "CS 110",
      hasTransferEquivalencies: true,
      equivalencyCount: 8,
      providerCount: 4,
      providers: ["Sophia Learning", "Study.com"],
      courseUrl: "https://snhu-transfers.vercel.app/courses/cs110",
    },
    {
      courseCode: "CS210",
      displayCourseCode: "CS 210",
      hasTransferEquivalencies: true,
      equivalencyCount: 3,
      providerCount: 2,
      providers: ["Study.com"],
      courseUrl: "https://snhu-transfers.vercel.app/courses/cs210",
    },
    {
      courseCode: "MAT140",
      displayCourseCode: "MAT 140",
      hasTransferEquivalencies: false,
      equivalencyCount: 0,
      providerCount: 0,
      providers: [],
      courseUrl: "https://snhu-transfers.vercel.app/courses/mat140",
    },
  ],
};

describe("GET /api/v1/transfer-coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing courses", async () => {
    const response = await GET(makeRequest(""));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "MISSING_COURSES",
        message: "The courses query parameter is required.",
      },
    });
    expect(mockedGetTransferCoverageResponse).not.toHaveBeenCalled();
  });

  it("rejects malformed values", async () => {
    const response = await GET(makeRequest("?courses=not-a-course"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_COURSE_CODE",
        message: "One or more course codes are invalid.",
        invalidCourseCodes: ["not-a-course"],
      },
    });
    expect(mockedGetTransferCoverageResponse).not.toHaveBeenCalled();
  });

  it("rejects more than 100 unique codes before database access", async () => {
    const codes = Array.from({ length: 101 }, (_, i) => `CS${100 + i}`).join(",");
    const response = await GET(makeRequest(`?courses=${codes}`));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "TOO_MANY_COURSES",
        message: "A maximum of 100 unique course codes may be requested.",
      },
    });
    expect(mockedGetTransferCoverageResponse).not.toHaveBeenCalled();
  });

  it("returns coverage with expected cache headers", async () => {
    mockedGetTransferCoverageResponse.mockResolvedValue(successBody);

    const response = await GET(makeRequest("?courses=CS110,CS210,MAT140"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    expect(response.headers.get("CDN-Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    expect(response.headers.get("Last-Modified")).toBe(
      new Date("2026-08-02T12:00:00.000Z").toUTCString()
    );

    const body = await response.json();
    expect(body.schemaVersion).toBe(1);
    expect(body).toEqual(successBody);
    expect(mockedGetTransferCoverageResponse).toHaveBeenCalledWith([
      "CS110",
      "CS210",
      "MAT140",
    ]);
  });

  it("normalizes spaced and hyphenated course codes before lookup", async () => {
    mockedGetTransferCoverageResponse.mockResolvedValue(successBody);

    await GET(makeRequest("?courses=CS%20110,cs-210,mat140"));
    expect(mockedGetTransferCoverageResponse).toHaveBeenCalledWith([
      "CS110",
      "CS210",
      "MAT140",
    ]);
  });

  it("returns 503 on a database failure and does not convert failure into zero coverage", async () => {
    mockedGetTransferCoverageResponse.mockRejectedValue(new Error("db down"));

    const response = await GET(makeRequest("?courses=CS110"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "TRANSFER_DATA_UNAVAILABLE",
        message: "Transfer-equivalency data is temporarily unavailable.",
      },
    });
    expect(body.courses).toBeUndefined();
    expect(body.matchedCourseCount).toBeUndefined();
  });

  it("does not expose internal IDs or secrets", async () => {
    mockedGetTransferCoverageResponse.mockResolvedValue(successBody);
    process.env.POSTGRES_URL = "postgresql://secret-user:secret-pass@host/db";

    const response = await GET(makeRequest("?courses=CS110,CS210,MAT140"));
    const text = await response.text();

    expect(text).not.toContain("secret-pass");
    expect(text).not.toContain("POSTGRES_URL");
    expect(text).not.toContain("lease");
    expect(text).not.toMatch(/"id"\s*:/);
    expect(text).not.toContain("transfer_courses_stage");
  });

  it("matches the route-contract fixture shape", async () => {
    mockedGetTransferCoverageResponse.mockResolvedValue(
      fixture as TransferCoverageResponse
    );

    const response = await GET(makeRequest("?courses=CS110,CS210,MAT140"));
    const body = await response.json();

    expect(body).toEqual(fixture);
    expect(body.schemaVersion).toBe(1);
    expect(Object.keys(body).sort()).toEqual([
      "courses",
      "dataLastUpdatedAt",
      "matchedCourseCount",
      "requestedCourseCount",
      "schemaVersion",
    ]);
    expect(Object.keys(body.courses[0]).sort()).toEqual([
      "courseCode",
      "courseUrl",
      "displayCourseCode",
      "equivalencyCount",
      "hasTransferEquivalencies",
      "providerCount",
      "providers",
    ]);
  });
});
