import pool from '../db.js';

/**
 * Service handling all operations on anonymous secrets.
 * Decoupled from Express req/res to enable easy migration to PostgreSQL or ORMs later.
 */
export const secretService = {
  /**
   * Retrieve all secrets sorted by newest first
   */
  async getAllSecrets() {
    const queryText = 'SELECT * FROM secrets ORDER BY created_at DESC;';
    const { rows } = await pool.query(queryText);
    return rows.map(row => ({
      id: row.id,
      text: row.content,
      createdAt: row.created_at
    }));
  },

  /**
   * Retrieve a single secret by numeric ID
   */
  async getSecretById(id) {
    const numericId = Number(id);
    const queryText = 'SELECT * FROM secrets WHERE id = $1;';
    const { rows } = await pool.query(queryText, [numericId]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      text: row.content,
      createdAt: row.created_at
    };
  },

  /**
   * Retrieve a random secret from the data store
   */
  async getRandomSecret() {
    const queryText = 'SELECT * FROM secrets ORDER BY RANDOM() LIMIT 1;';
    const { rows } = await pool.query(queryText);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      text: row.content,
      createdAt: row.created_at
    };
  },

  /**
   * Create a new anonymous secret
   */
  async createSecret(text) {
    const trimmedText = text.trim();
    const queryText = 'INSERT INTO secrets (content) VALUES ($1) RETURNING *;';
    const { rows } = await pool.query(queryText, [trimmedText]);
    const row = rows[0];
    return {
      id: row.id,
      text: row.content,
      createdAt: row.created_at
    };
  },

  /**
   * Delete a secret by ID
   */
  async deleteSecret(id) {
    const numericId = Number(id);
    const queryText = 'DELETE FROM secrets WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(queryText, [numericId]);
    return rows.length > 0;
  }
};
