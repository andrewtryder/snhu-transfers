import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    await client.query('DROP TABLE IF EXISTS transfer_courses');

    const createTableText = `
      CREATE TABLE IF NOT EXISTS transfer_courses (
        id SERIAL PRIMARY KEY,
        "subjectprefix" VARCHAR(255),
        "coursenumber" VARCHAR(255),
        title TEXT,
        pid VARCHAR(255),
        "eligibilitytimeframe" TEXT,
        "groupfilter2name" VARCHAR(255),
        "academiclevel" VARCHAR(255),
        "coursepid" VARCHAR(255)
      );
    `;

    await client.query(createTableText);
    console.log('transfer_courses table created.');

  } catch (err) {
    console.error('Error creating table', err);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

setupDatabase();
