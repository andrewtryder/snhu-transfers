import { asc, count, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { transferCourses } from "@/db/schema";
import { normalizeCourseNumber, slugify } from "@/lib/slug";
import { TRANSFER_SYNC_ID } from "@/lib/transfer-sync/persist";

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

export type DirectoryEntry = {
  value: string;
  count: number;
  slug: string;
};

export type CourseDirectoryEntry = DirectoryEntry & {
  subjectPrefix: string;
};

function toDirectoryEntries(
  rows: Array<{ value: string | null; count: number }>
): DirectoryEntry[] {
  const map = new Map<string, number>();

  for (const row of rows) {
    const value = (row.value ?? "").trim();
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + Number(row.count));
  }

  return Array.from(map.entries())
    .map(([value, entryCount]) => ({ value, count: entryCount, slug: slugify(value) }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

export async function getSubjectDirectoryEntries(): Promise<DirectoryEntry[]> {
  const rows = await db
    .select({
      value: transferCourses.subjectPrefix,
      count: count(),
    })
    .from(transferCourses)
    .where(isNotNull(transferCourses.subjectPrefix))
    .groupBy(transferCourses.subjectPrefix);

  return toDirectoryEntries(rows);
}

export async function getOrganizationDirectoryEntries(): Promise<DirectoryEntry[]> {
  const rows = await db
    .select({
      value: transferCourses.groupFilter2Name,
      count: count(),
    })
    .from(transferCourses)
    .where(isNotNull(transferCourses.groupFilter2Name))
    .groupBy(transferCourses.groupFilter2Name);

  return toDirectoryEntries(rows);
}

export async function getLevelDirectoryEntries(): Promise<DirectoryEntry[]> {
  const rows = await db
    .select({
      value: transferCourses.academicLevel,
      count: count(),
    })
    .from(transferCourses)
    .where(isNotNull(transferCourses.academicLevel))
    .groupBy(transferCourses.academicLevel);

  return toDirectoryEntries(rows);
}

export async function getCourseDirectoryEntries(): Promise<CourseDirectoryEntry[]> {
  const rows = await db
    .select({
      courseNumber: transferCourses.courseNumber,
      subjectPrefix: transferCourses.subjectPrefix,
      count: count(),
    })
    .from(transferCourses)
    .where(isNotNull(transferCourses.courseNumber))
    .groupBy(transferCourses.courseNumber, transferCourses.subjectPrefix);

  const map = new Map<string, CourseDirectoryEntry>();

  for (const row of rows) {
    const value = (row.courseNumber ?? "").trim();
    if (!value) continue;

    const subjectPrefix = (row.subjectPrefix ?? "").trim();
    const key = `${subjectPrefix}\0${value}`;
    const existing = map.get(key);
    const entryCount = Number(row.count);

    if (existing) {
      existing.count += entryCount;
    } else {
      map.set(key, {
        value,
        subjectPrefix,
        count: entryCount,
        slug: slugify(value),
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      a.subjectPrefix.localeCompare(b.subjectPrefix) || a.value.localeCompare(b.value)
  );
}

export async function getTransferLastModified(): Promise<Date | null> {
  try {
    const result = await db.execute(
      sql`SELECT completed_at FROM transfer_sync_state WHERE id = ${TRANSFER_SYNC_ID}`
    );

    const rows = Array.isArray(result)
      ? result
      : ((result as { rows?: unknown[] }).rows ?? []);

    if (rows.length === 0) return null;

    const raw = (rows[0] as { completed_at?: unknown }).completed_at;
    if (raw == null) return null;

    const date = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}
