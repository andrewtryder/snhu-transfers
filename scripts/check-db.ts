import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { db } from '../src/db/index.js';
import { courses } from '../src/db/schema.js';
import { count } from 'drizzle-orm';

async function check() {
    const res = await db.select({ value: count() }).from(courses);
    console.log(`Courses in DB: ${res[0].value}`);
}
check();
