import { asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { transferCourses } from "@/db/schema";
import { normalizeCourseNumber, slugify } from "@/lib/slug";

export type TransferRow = {
  subjectPrefix: string | null;
  courseNumber: string | null;
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
};

export async function getAllTransferRows(): Promise<TransferRow[]> {
  return db
    .select({
      subjectPrefix: transferCourses.subjectPrefix,
      courseNumber: transferCourses.courseNumber,
      title: transferCourses.title,
      pid: transferCourses.pid,
      eligibilityTimeframe: transferCourses.eligibilityTimeframe,
      groupFilter2Name: transferCourses.groupFilter2Name,
      academicLevel: transferCourses.academicLevel,
      coursePID: transferCourses.coursePID,
    })
    .from(transferCourses)
    .orderBy(asc(transferCourses.courseNumber));
}

export async function getDistinctSubjects(): Promise<string[]> {
  const rows = await db
    .select({ value: transferCourses.subjectPrefix })
    .from(transferCourses)
    .where(isNotNull(transferCourses.subjectPrefix));

  return Array.from(new Set(rows.map((r) => (r.value ?? "").trim()).filter(Boolean))).sort();
}

export async function getDistinctOrganizations(): Promise<string[]> {
  const rows = await db
    .select({ value: transferCourses.groupFilter2Name })
    .from(transferCourses)
    .where(isNotNull(transferCourses.groupFilter2Name));

  return Array.from(new Set(rows.map((r) => (r.value ?? "").trim()).filter(Boolean))).sort();
}

export async function getDistinctLevels(): Promise<string[]> {
  const rows = await db
    .select({ value: transferCourses.academicLevel })
    .from(transferCourses)
    .where(isNotNull(transferCourses.academicLevel));

  return Array.from(new Set(rows.map((r) => (r.value ?? "").trim()).filter(Boolean))).sort();
}

export async function getDistinctCourseNumbers(): Promise<string[]> {
  const rows = await db
    .select({ value: transferCourses.courseNumber })
    .from(transferCourses)
    .where(isNotNull(transferCourses.courseNumber));

  return Array.from(new Set(rows.map((r) => (r.value ?? "").trim()).filter(Boolean))).sort();
}

export async function resolveSubjectBySlug(slug: string): Promise<string | null> {
  const all = await getDistinctSubjects();
  return all.find((value) => slugify(value) === slug) ?? null;
}

export async function resolveOrganizationBySlug(slug: string): Promise<string | null> {
  const all = await getDistinctOrganizations();
  return all.find((value) => slugify(value) === slug) ?? null;
}

export async function resolveLevelBySlug(slug: string): Promise<string | null> {
  const all = await getDistinctLevels();
  return all.find((value) => slugify(value) === slug) ?? null;
}

export async function getRowsBySubject(subjectPrefix: string): Promise<TransferRow[]> {
  return db
    .select({
      subjectPrefix: transferCourses.subjectPrefix,
      courseNumber: transferCourses.courseNumber,
      title: transferCourses.title,
      pid: transferCourses.pid,
      eligibilityTimeframe: transferCourses.eligibilityTimeframe,
      groupFilter2Name: transferCourses.groupFilter2Name,
      academicLevel: transferCourses.academicLevel,
      coursePID: transferCourses.coursePID,
    })
    .from(transferCourses)
    .where(eq(transferCourses.subjectPrefix, subjectPrefix))
    .orderBy(asc(transferCourses.courseNumber), asc(transferCourses.groupFilter2Name));
}

export async function getRowsByOrganization(organization: string): Promise<TransferRow[]> {
  return db
    .select({
      subjectPrefix: transferCourses.subjectPrefix,
      courseNumber: transferCourses.courseNumber,
      title: transferCourses.title,
      pid: transferCourses.pid,
      eligibilityTimeframe: transferCourses.eligibilityTimeframe,
      groupFilter2Name: transferCourses.groupFilter2Name,
      academicLevel: transferCourses.academicLevel,
      coursePID: transferCourses.coursePID,
    })
    .from(transferCourses)
    .where(eq(transferCourses.groupFilter2Name, organization))
    .orderBy(asc(transferCourses.courseNumber), asc(transferCourses.title));
}

export async function getRowsByLevel(level: string): Promise<TransferRow[]> {
  return db
    .select({
      subjectPrefix: transferCourses.subjectPrefix,
      courseNumber: transferCourses.courseNumber,
      title: transferCourses.title,
      pid: transferCourses.pid,
      eligibilityTimeframe: transferCourses.eligibilityTimeframe,
      groupFilter2Name: transferCourses.groupFilter2Name,
      academicLevel: transferCourses.academicLevel,
      coursePID: transferCourses.coursePID,
    })
    .from(transferCourses)
    .where(eq(transferCourses.academicLevel, level))
    .orderBy(asc(transferCourses.courseNumber), asc(transferCourses.groupFilter2Name));
}

export async function getRowsByCourseNumber(courseNumber: string): Promise<TransferRow[]> {
  const normalized = normalizeCourseNumber(courseNumber);
  return db
    .select({
      subjectPrefix: transferCourses.subjectPrefix,
      courseNumber: transferCourses.courseNumber,
      title: transferCourses.title,
      pid: transferCourses.pid,
      eligibilityTimeframe: transferCourses.eligibilityTimeframe,
      groupFilter2Name: transferCourses.groupFilter2Name,
      academicLevel: transferCourses.academicLevel,
      coursePID: transferCourses.coursePID,
    })
    .from(transferCourses)
    .where(eq(transferCourses.courseNumber, normalized))
    .orderBy(asc(transferCourses.groupFilter2Name), asc(transferCourses.title));
}

export type FacetSummary = {
  value: string;
  count: number;
  slug: string;
};

export async function getFacetSummaries(limit = 20): Promise<{
  subjects: FacetSummary[];
  organizations: FacetSummary[];
  levels: FacetSummary[];
  courses: FacetSummary[];
}> {
  const rows = await getAllTransferRows();

  const build = (values: Array<string | null>): FacetSummary[] => {
    const map = new Map<string, number>();
    values.forEach((raw) => {
      const value = (raw ?? "").trim();
      if (!value) return;
      map.set(value, (map.get(value) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([value, count]) => ({ value, count, slug: slugify(value) }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
      .slice(0, limit);
  };

  return {
    subjects: build(rows.map((r) => r.subjectPrefix)),
    organizations: build(rows.map((r) => r.groupFilter2Name)),
    levels: build(rows.map((r) => r.academicLevel)),
    courses: build(rows.map((r) => r.courseNumber)),
  };
}

export function getRelatedFacets(rows: TransferRow[]) {
  const subjects = Array.from(new Set(rows.map((r) => r.subjectPrefix).filter(Boolean) as string[])).sort();
  const organizations = Array.from(new Set(rows.map((r) => r.groupFilter2Name).filter(Boolean) as string[])).sort();
  const levels = Array.from(new Set(rows.map((r) => r.academicLevel).filter(Boolean) as string[])).sort();
  const courses = Array.from(new Set(rows.map((r) => r.courseNumber).filter(Boolean) as string[])).sort();

  return { subjects, organizations, levels, courses };
}
