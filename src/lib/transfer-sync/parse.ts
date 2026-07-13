import type { KualiExperienceDetail } from './fetch';

export interface ParsedTransferCourse {
  subjectPrefix: string;
  courseNumber: string;
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
}

export function parseExperienceDetail(
  detail: KualiExperienceDetail
): ParsedTransferCourse[] {
  if (!detail.rulesAchievementCriteria) {
    return [];
  }

  const courseLinkRegex =
    /<a href="#\/courses\/view\/[^"]*" target="_blank">([A-Z]+[0-9]+E?L?E?)<\/a>/g;
  const rows: ParsedTransferCourse[] = [];
  let match: RegExpExecArray | null;

  while ((match = courseLinkRegex.exec(detail.rulesAchievementCriteria)) !== null) {
    const courseNumber = match[1];
    const subjectPrefix = courseNumber.replace(/[0-9]+(ELE)?$/g, '');

    rows.push({
      subjectPrefix,
      courseNumber,
      title: detail.title ?? null,
      pid: detail.pid ?? null,
      eligibilityTimeframe: detail.eligibilityTimeframe ?? null,
      groupFilter2Name: detail.groupFilter2?.name || null,
      academicLevel: detail.academicLevel?.name || null,
      coursePID: null,
    });
  }

  return rows;
}
