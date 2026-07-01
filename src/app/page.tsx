import { Client } from 'pg';
import ClientPage from './ClientPage';

export const revalidate = 0; // Disable static rendering for now so we always get fresh data

type Course = {
  title: string | null;
  pid: string | null;
  eligibilityTimeframe: string | null;
  groupFilter2Name: string | null;
  academicLevel: string | null;
  coursePID: string | null;
  courseName: string | null;
};

type CoursesByNumber = {
  [courseNumber: string]: Course[];
};

type CoursesData = {
  [subjectPrefix: string]: CoursesByNumber;
};

async function getCoursesData(): Promise<CoursesData> {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();

    // Explicitly order by courseNumber to ensure sorting
    const res = await client.query('SELECT * FROM courses ORDER BY "coursenumber" ASC');

    const data: CoursesData = {};

    for (const row of res.rows) {
      // The Postgres driver returns column names in lowercase unless quoted in the schema
      const subjectPrefix = row.subjectprefix;
      const courseNumber = row.coursenumber;

      if (!data[subjectPrefix]) {
        data[subjectPrefix] = {};
      }
      if (!data[subjectPrefix][courseNumber]) {
        data[subjectPrefix][courseNumber] = [];
      }

      data[subjectPrefix][courseNumber].push({
        title: row.title,
        pid: row.pid,
        eligibilityTimeframe: row.eligibilitytimeframe,
        groupFilter2Name: row.groupfilter2name,
        academicLevel: row.academiclevel,
        coursePID: row.coursepid,
        courseName: row.coursenumber
      });
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch courses from database:", error);
    return {};
  } finally {
    await client.end();
  }
}

export default async function Page() {
  const coursesData = await getCoursesData();
  return <ClientPage initialCoursesData={coursesData} />;
}
