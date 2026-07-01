import ClientPage from './ClientPage';
import { db } from '../db';
import { transferCourses } from '../db/schema';
import { asc } from 'drizzle-orm';

type Course = {
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
  courseName: string | null;
};

type CoursesByGroup = {
  [groupName: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByGroup;
};

async function getCoursesData(): Promise<CoursesData> {
  try {
    const allCourses = await db.select().from(transferCourses).orderBy(asc(transferCourses.courseNumber));

    const data: CoursesData = {};

    for (const row of allCourses) {
      const subjectPrefix = row.subjectPrefix || 'UNKNOWN';
      const courseNumber = row.courseNumber || 'UNKNOWN';

      if (!data[subjectPrefix]) {
        data[subjectPrefix] = {};
      }
      if (!data[subjectPrefix][courseNumber]) {
        data[subjectPrefix][courseNumber] = [];
      }

      data[subjectPrefix][courseNumber].push({
        title: row.title,
        pid: row.pid,
        eligibilityTimeframe: row.eligibilityTimeframe,
        groupFilter2Name: row.groupFilter2Name,
        academicLevel: row.academicLevel,
        coursePID: row.coursePID,
        courseName: row.courseNumber
      });
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch courses from database:", error);
    return {};
  }
}

export default async function Page() {
  const coursesData = await getCoursesData();
  return <ClientPage initialCoursesData={coursesData} />;
}
