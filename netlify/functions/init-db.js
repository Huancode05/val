// netlify/functions/init-db.js
import { Client } from 'pg';

export async function handler() {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    await client.connect();

    // 动态表结构（如需更多字段可以告诉我）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS dynamics (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        noise_vote INTEGER DEFAULT 0
      );
    `;

    await client.query(createTableSQL);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Dynamics table created or already exists!",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    await client.end();
  }
}