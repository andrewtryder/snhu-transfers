import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const maxDuration = 60; // 5 minutes (requires Pro plan usually, but we can set it to the max allowed)

const LIST_EXPERIENCES_URL = 'https://snhu.kuali.co/api/v1/catalog/experiences/62d0386e064ce7001cec61d1?q=';
const EXPERIENCE_DETAIL_URL_PREFIX = 'https://snhu.kuali.co/api/v1/catalog/experience/62d0386e064ce7001cec61d1/';
const LIST_COURSES_URL = 'https://snhu.kuali.co/api/v1/catalog/courses/6349a3f9164d00001c6c80da?q=';

async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
    });

    try {
        await client.connect();

        console.log("Fetching list of all experiences...");
        const experiencesList = await fetchWithRetry(LIST_EXPERIENCES_URL);

        const coursesList = await fetchWithRetry(LIST_COURSES_URL);
        const coursesMap = new Map();
        for (const course of coursesList) {
            coursesMap.set(course.__catalogCourseId, course);
        }

        console.log(`Found ${experiencesList.length} experiences to process.`);

        const parsedCourses: Record<string, unknown>[] = [];

        // Process in batches of 20 to avoid overwhelming the Kuali API
        const batchSize = 20;
        for (let i = 0; i < experiencesList.length; i += batchSize) {
            const batch = experiencesList.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1} / ${Math.ceil(experiencesList.length / batchSize)}`);

            const batchPromises = batch.map(async (expListItem: Record<string, unknown>) => {
                if (!expListItem.pid) return;

                try {
                    const detail = await fetchWithRetry(`${EXPERIENCE_DETAIL_URL_PREFIX}${expListItem.pid}`);

                    if (detail && detail.rulesAchievementCriteria) {
                        const regex = /<a href="#\/courses\/view\/[^"]*" target="_blank">([A-Z]+[0-9]+E?L?E?)<\/a>/g;
                        let match;

                        while ((match = regex.exec(detail.rulesAchievementCriteria)) !== null) {
                            const courseNumber = match[1];
                            const subjectPrefix = courseNumber.replace(/[0-9]+(ELE)?$/g, '');

                            parsedCourses.push({
                                subjectPrefix,
                                courseNumber,
                                title: detail.title,
                                pid: detail.pid,
                                eligibilityTimeframe: detail.eligibilityTimeframe,
                                groupFilter2Name: detail.groupFilter2?.name || null,
                                academicLevel: detail.academicLevel?.name || null,
                                coursePID: coursesMap.get(courseNumber)?.id || null
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch/parse details for PID: ${expListItem.pid}`, error);
                }
            });

            await Promise.all(batchPromises);

            // Add a small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`Extracted ${parsedCourses.length} mapped courses. Writing to database...`);

        // Start a transaction
        await client.query('BEGIN');

        await client.query('DELETE FROM courses');

        for (const c of parsedCourses) {
            await client.query(
                `INSERT INTO courses (subjectPrefix, courseNumber, title, pid, eligibilityTimeframe, groupFilter2Name, academicLevel, coursePID)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [c.subjectPrefix, c.courseNumber, c.title, c.pid, c.eligibilityTimeframe, c.groupFilter2Name, c.academicLevel, c.coursePID]
            );
        }

        await client.query('COMMIT');

        return NextResponse.json({ success: true, count: parsedCourses.length });
    } catch (error) {
        console.error("Error during update process:", error);
        if (client) {
            await client.query('ROLLBACK');
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        await client.end();
    }
}
