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

    const createTableText = `
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        subjectPrefix VARCHAR(255),
        courseNumber VARCHAR(255),
        title TEXT,
        pid VARCHAR(255),
        eligibilityTimeframe TEXT,
        groupFilter2Name VARCHAR(255),
        academicLevel VARCHAR(255),
        coursePID VARCHAR(255)
      );
    `;

    await client.query(createTableText);
    console.log('Courses table created or already exists.');

  } catch (err) {
    console.error('Error creating table', err);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

setupDatabase();
