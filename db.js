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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active',
      report_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS moderation_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(50) NOT NULL,
      secret_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(queryText);

  try {
    await pool.query("ALTER TABLE secrets ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'");
    await pool.query("ALTER TABLE secrets ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0");
  } catch (err) {
    console.log("Columns likely already exist or minor alter error:", err.message);
  }
};

export default pool;
