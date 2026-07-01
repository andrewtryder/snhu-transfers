import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function check() {
    const client = new Client({ connectionString: process.env.POSTGRES_URL });
    await client.connect();
    const res = await client.query('SELECT count(*) FROM courses');
    console.log(`Courses in DB: ${res.rows[0].count}`);
    await client.end();
}
check();
