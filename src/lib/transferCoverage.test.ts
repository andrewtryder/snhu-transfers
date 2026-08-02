/**
 * @jest-environment node
 */

jest.mock("next/cache", () => ({
  unstable_cache: jest.fn(<T extends (...args: unknown[]) => unknown>(fn: T) => fn),
  revalidateTag: jest.fn(),
}));

const selectMock = jest.fn();
const fromMock = jest.fn();
const whereMock = jest.fn();

jest.mock("@/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      selectMock(...args);
      return {
        from: (...fromArgs: unknown[]) => {
          fromMock(...fromArgs);
          return {
            where: (...whereArgs: unknown[]) => {
              whereMock(...whereArgs);
              return whereMock.mock.results.at(-1)?.value;
            },
          };
        },
      };
    },
  },
}));

jest.mock("@/lib/seoQueries", () => ({
  getTransferLastModified: jest.fn(),
}));

import { transferCourses } from "@/db/schema";
import { getTransferLastModified } from "@/lib/seoQueries";
import {
  aggregateTransferCoverage,
  fetchTransferCoverageRows,
  getTransferCoverageResponse,
  type TransferCoverageRow,
} from "./transferCoverage";

const mockedGetTransferLastModified = getTransferLastModified as jest.MockedFunction<
  typeof getTransferLastModified
>;

describe("aggregateTransferCoverage", () => {
  const baseUrl = "https://snhu-transfers.vercel.app";

  it("counts distinct transfer experiences by pid and deduplicates providers", () => {
    const rows: TransferCoverageRow[] = [
      { courseNumber: "CS110", pid: "p1", groupFilter2Name: "Study.com" },
      { courseNumber: "CS110", pid: "p1", groupFilter2Name: "Study.com" },
      { courseNumber: "CS110", pid: "p2", groupFilter2Name: "Sophia Learning" },
      { courseNumber: "CS110", pid: "p3", groupFilter2Name: "Sophia Learning" },
    ];

    const result = aggregateTransferCoverage(
      ["CS110"],
      rows,
      new Date("2026-08-02T12:00:00.000Z"),
      baseUrl
    );

    expect(result.schemaVersion).toBe(1);
    expect(result.courses[0]).toEqual({
      courseCode: "CS110",
      displayCourseCode: "CS 110",
      hasTransferEquivalencies: true,
      equivalencyCount: 3,
      providerCount: 2,
      providers: ["Sophia Learning", "Study.com"],
      courseUrl: "https://snhu-transfers.vercel.app/courses/cs110",
    });
  });

  it("sorts providers deterministically", () => {
    const rows: TransferCoverageRow[] = [
      { courseNumber: "CS210", pid: "a", groupFilter2Name: "Zebra Org" },
      { courseNumber: "CS210", pid: "b", groupFilter2Name: "Alpha Org" },
    ];

    const result = aggregateTransferCoverage(["CS210"], rows, null, baseUrl);
    expect(result.courses[0].providers).toEqual(["Alpha Org", "Zebra Org"]);
  });

  it("returns unmatched courses explicitly and preserves request order", () => {
    const rows: TransferCoverageRow[] = [
      { courseNumber: "CS210", pid: "p1", groupFilter2Name: "Study.com" },
    ];

    const result = aggregateTransferCoverage(
      ["MAT999", "CS210", "ENG999"],
      rows,
      null,
      baseUrl
    );

    expect(result.requestedCourseCount).toBe(3);
    expect(result.matchedCourseCount).toBe(1);
    expect(result.courses.map((course) => course.courseCode)).toEqual([
      "MAT999",
      "CS210",
      "ENG999",
    ]);
    expect(result.courses[0]).toMatchObject({
      hasTransferEquivalencies: false,
      equivalencyCount: 0,
      providerCount: 0,
      providers: [],
    });
    expect(result.courses[1].hasTransferEquivalencies).toBe(true);
    expect(result.dataLastUpdatedAt).toBeNull();
  });

  it("returns the last successful synchronization timestamp", () => {
    const result = aggregateTransferCoverage(
      ["CS110"],
      [{ courseNumber: "CS110", pid: "p1", groupFilter2Name: "Sophia Learning" }],
      new Date("2026-08-02T12:00:00.000Z"),
      baseUrl
    );
    expect(result.dataLastUpdatedAt).toBe("2026-08-02T12:00:00.000Z");
  });

  it("accepts rehydrated ISO string timestamps from unstable_cache", () => {
    const result = aggregateTransferCoverage(
      ["CS110"],
      [{ courseNumber: "CS110", pid: "p1", groupFilter2Name: "Sophia Learning" }],
      "2026-08-02T12:00:00.000Z",
      baseUrl
    );
    expect(result.dataLastUpdatedAt).toBe("2026-08-02T12:00:00.000Z");
  });

  it("falls back to row count when pid is unavailable", () => {
    const rows: TransferCoverageRow[] = [
      { courseNumber: "CS110", pid: null, groupFilter2Name: "Sophia Learning" },
      { courseNumber: "CS110", pid: "  ", groupFilter2Name: "Study.com" },
    ];

    const result = aggregateTransferCoverage(["CS110"], rows, null, baseUrl);
    expect(result.courses[0].equivalencyCount).toBe(2);
  });

  it("generates canonical course URLs", () => {
    const result = aggregateTransferCoverage(["CS110"], [], null, baseUrl);
    expect(result.courses[0].courseUrl).toBe(
      "https://snhu-transfers.vercel.app/courses/cs110"
    );
  });

  it("sets schemaVersion to exactly 1", () => {
    const result = aggregateTransferCoverage([], [], null, baseUrl);
    expect(result.schemaVersion).toBe(1);
  });
});

describe("fetchTransferCoverageRows", () => {
  beforeEach(() => {
    selectMock.mockClear();
    fromMock.mockClear();
    whereMock.mockReset();
    whereMock.mockResolvedValue([]);
  });

  it("uses one batch query rather than N queries", async () => {
    whereMock.mockResolvedValue([
      { courseNumber: "CS110", pid: "p1", groupFilter2Name: "Sophia Learning" },
      { courseNumber: "CS210", pid: "p2", groupFilter2Name: "Study.com" },
    ]);

    const rows = await fetchTransferCoverageRows(["CS110", "CS210", "MAT140"]);

    expect(selectMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(whereMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith(transferCourses);
    expect(rows).toHaveLength(2);

    const selected = selectMock.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(selected).sort()).toEqual([
      "courseNumber",
      "groupFilter2Name",
      "pid",
    ]);
  });

  it("does not query when the course list is empty", async () => {
    await fetchTransferCoverageRows([]);
    expect(selectMock).not.toHaveBeenCalled();
  });
});

describe("getTransferCoverageResponse", () => {
  beforeEach(() => {
    selectMock.mockClear();
    fromMock.mockClear();
    whereMock.mockReset();
    whereMock.mockResolvedValue([]);
    mockedGetTransferLastModified.mockReset();
  });

  it("handles a null synchronization timestamp independently of coverage", async () => {
    whereMock.mockResolvedValue([
      { courseNumber: "CS110", pid: "p1", groupFilter2Name: "Sophia Learning" },
    ]);
    mockedGetTransferLastModified.mockResolvedValue(null);

    const result = await getTransferCoverageResponse(["CS110"]);
    expect(result.dataLastUpdatedAt).toBeNull();
    expect(result.matchedCourseCount).toBe(1);
    expect(result.courses[0].hasTransferEquivalencies).toBe(true);
  });
});
