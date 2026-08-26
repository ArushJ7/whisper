import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Initialize the database by creating the secrets table if it doesn't exist.
 */
export const initDatabase = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS secrets (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(queryText);
};

export default pool;
