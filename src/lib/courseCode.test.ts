/**
 * @jest-environment node
 */

import {
  formatTransferCourseCode,
  isValidTransferCourseCode,
  MAX_TRANSFER_COVERAGE_COURSES,
  normalizeTransferCourseCode,
  parseCoursesQuery,
} from "./courseCode";

describe("normalizeTransferCourseCode", () => {
  it("accepts CS110 unchanged (aside from trim)", () => {
    expect(normalizeTransferCourseCode("CS110")).toBe("CS110");
  });

  it("normalizes spaced input CS 110", () => {
    expect(normalizeTransferCourseCode("CS 110")).toBe("CS110");
  });

  it("normalizes hyphenated input CS-110", () => {
    expect(normalizeTransferCourseCode("CS-110")).toBe("CS110");
  });

  it("accepts lowercase input", () => {
    expect(normalizeTransferCourseCode("cs110")).toBe("CS110");
  });

  it("normalizes elective and lab-style codes", () => {
    expect(normalizeTransferCourseCode("acc 1ele")).toBe("ACC1ELE");
    expect(normalizeTransferCourseCode("bio-120l")).toBe("BIO120L");
  });
});

describe("formatTransferCourseCode", () => {
  it("inserts a space before the numeric segment", () => {
    expect(formatTransferCourseCode("CS110")).toBe("CS 110");
    expect(formatTransferCourseCode("MAT243")).toBe("MAT 243");
    expect(formatTransferCourseCode("CS510")).toBe("CS 510");
  });

  it("keeps lab/elective suffixes attached to the numeric segment", () => {
    expect(formatTransferCourseCode("BIO120L")).toBe("BIO 120L");
    expect(formatTransferCourseCode("ACC1ELE")).toBe("ACC 1ELE");
  });

  it("returns the canonical value when spacing is ambiguous", () => {
    expect(formatTransferCourseCode("???")).toBe("???");
  });
});

describe("isValidTransferCourseCode", () => {
  it("accepts standard and elective-style codes", () => {
    expect(isValidTransferCourseCode("CS110")).toBe(true);
    expect(isValidTransferCourseCode("CS 110")).toBe(true);
    expect(isValidTransferCourseCode("BIO120L")).toBe(true);
    expect(isValidTransferCourseCode("ACC1ELE")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isValidTransferCourseCode("not-a-course")).toBe(false);
    expect(isValidTransferCourseCode("123")).toBe(false);
    expect(isValidTransferCourseCode("CS")).toBe(false);
    expect(isValidTransferCourseCode("")).toBe(false);
  });
});

describe("parseCoursesQuery", () => {
  it("deduplicates repeated course codes and preserves first-seen order", () => {
    const parsed = parseCoursesQuery("MAT140,CS110,cs 110,CS-210,CS110");
    expect(parsed).toEqual({
      ok: true,
      courseCodes: ["MAT140", "CS110", "CS210"],
    });
  });

  it("rejects missing courses", () => {
    expect(parseCoursesQuery(null)).toEqual({ ok: false, error: "MISSING_COURSES" });
    expect(parseCoursesQuery("")).toEqual({ ok: false, error: "MISSING_COURSES" });
    expect(parseCoursesQuery(" , , ")).toEqual({ ok: false, error: "MISSING_COURSES" });
  });

  it("rejects malformed values", () => {
    expect(parseCoursesQuery("CS110,not-a-course")).toEqual({
      ok: false,
      error: "INVALID_COURSE_CODE",
      invalidCourseCodes: ["not-a-course"],
    });
  });

  it("rejects more than 100 unique codes", () => {
    const codes = Array.from({ length: MAX_TRANSFER_COVERAGE_COURSES + 1 }, (_, i) => `CS${100 + i}`);
    expect(parseCoursesQuery(codes.join(","))).toEqual({
      ok: false,
      error: "TOO_MANY_COURSES",
    });
  });

  it("allows exactly 100 unique codes", () => {
    const codes = Array.from({ length: MAX_TRANSFER_COVERAGE_COURSES }, (_, i) => `CS${100 + i}`);
    const parsed = parseCoursesQuery(codes.join(","));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.courseCodes).toHaveLength(100);
    }
  });
});
