import type { TransferRow } from "@/lib/seoQueries";
import {
  summarizeCoursePage,
  summarizeLevelPage,
  summarizeOrganizationPage,
  summarizeSubjectPage,
} from "@/lib/seoSummaries";

function row(partial: Partial<TransferRow>): TransferRow {
  return {
    subjectPrefix: null,
    courseNumber: null,
    title: null,
    pid: null,
    eligibilityTimeframe: null,
    groupFilter2Name: null,
    academicLevel: null,
    coursePID: null,
    ...partial,
  };
}

describe("seoSummaries", () => {
  describe("summarizeCoursePage", () => {
    it("uses singular grammar for one option", () => {
      expect(
        summarizeCoursePage("ACC-201", [
          row({ groupFilter2Name: "Sophia Learning", academicLevel: "Undergraduate" }),
        ])
      ).toBe(
        "SNHU ACC-201 currently has 1 listed transfer option from 1 organization across 1 academic level."
      );
    });

    it("uses plural grammar for multiple options", () => {
      expect(
        summarizeCoursePage("ACC-201", [
          row({ groupFilter2Name: "Sophia Learning", academicLevel: "Undergraduate" }),
          row({ groupFilter2Name: "Study.com", academicLevel: "Undergraduate" }),
          row({ groupFilter2Name: "Coursera", academicLevel: "Graduate" }),
        ])
      ).toBe(
        "SNHU ACC-201 currently has 3 listed transfer options from 3 organizations across 2 academic levels."
      );
    });

    it("counts duplicate organizations once", () => {
      expect(
        summarizeCoursePage("ACC-201", [
          row({ groupFilter2Name: "Sophia Learning", academicLevel: "Undergraduate" }),
          row({ groupFilter2Name: "Sophia Learning", academicLevel: "Undergraduate" }),
          row({ groupFilter2Name: "Study.com", academicLevel: "Undergraduate" }),
        ])
      ).toBe(
        "SNHU ACC-201 currently has 3 listed transfer options from 2 organizations across 1 academic level."
      );
    });

    it("ignores null organizations and omits missing levels", () => {
      expect(
        summarizeCoursePage("ACC-201", [
          row({ groupFilter2Name: null, academicLevel: null }),
          row({ groupFilter2Name: "  ", academicLevel: "" }),
          row({ groupFilter2Name: "Sophia Learning", academicLevel: null }),
        ])
      ).toBe("SNHU ACC-201 currently has 3 listed transfer options from 1 organization.");
    });
  });

  describe("summarizeSubjectPage", () => {
    it("counts duplicate courses once", () => {
      expect(
        summarizeSubjectPage("Accounting", [
          row({ courseNumber: "ACC-201", groupFilter2Name: "Sophia Learning" }),
          row({ courseNumber: "ACC-201", groupFilter2Name: "Study.com" }),
          row({ courseNumber: "ACC-202", groupFilter2Name: "Sophia Learning" }),
        ])
      ).toBe(
        "The Accounting subject includes 3 listed transfer options across 2 SNHU courses from 2 organizations."
      );
    });
  });

  describe("summarizeOrganizationPage", () => {
    it("uses singular and plural grammar correctly", () => {
      expect(
        summarizeOrganizationPage("Sophia Learning", [
          row({ courseNumber: "ACC-201", subjectPrefix: "Accounting" }),
        ])
      ).toBe(
        "Sophia Learning currently has 1 listed transfer option mapping to 1 SNHU course across 1 subject area."
      );

      expect(
        summarizeOrganizationPage("Sophia Learning", [
          row({ courseNumber: "ACC-201", subjectPrefix: "Accounting" }),
          row({ courseNumber: "ENG-122", subjectPrefix: "English" }),
          row({ courseNumber: "MAT-240", subjectPrefix: "Mathematics" }),
        ])
      ).toBe(
        "Sophia Learning currently has 3 listed transfer options mapping to 3 SNHU courses across 3 subject areas."
      );
    });
  });

  describe("summarizeLevelPage", () => {
    it("uses singular and plural grammar correctly", () => {
      expect(
        summarizeLevelPage("Undergraduate", [
          row({ courseNumber: "ACC-201", groupFilter2Name: "Sophia Learning" }),
        ])
      ).toBe(
        "The Undergraduate directory contains 1 listed transfer option across 1 SNHU course from 1 organization."
      );

      expect(
        summarizeLevelPage("Undergraduate", [
          row({ courseNumber: "ACC-201", groupFilter2Name: "Sophia Learning" }),
          row({ courseNumber: "ENG-122", groupFilter2Name: "Study.com" }),
          row({ courseNumber: "MAT-240", groupFilter2Name: "Coursera" }),
        ])
      ).toBe(
        "The Undergraduate directory contains 3 listed transfer options across 3 SNHU courses from 3 organizations."
      );
    });
  });
});
