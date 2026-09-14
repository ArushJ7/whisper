import pool from '../db.js';

/**
 * Service handling all operations on anonymous secrets.
 * Decoupled from Express req/res to enable easy migration to PostgreSQL or ORMs later.
 */
export const secretService = {
  /**
   * Retrieve all active secrets sorted by newest first (for public API)
   */
  async getAllSecrets() {
    const queryText = "SELECT * FROM secrets WHERE status = 'active' ORDER BY created_at DESC;";
    const { rows } = await pool.query(queryText);
    return rows.map(row => ({
      id: row.id,
      text: row.content,
      createdAt: row.created_at
    }));
  },

  /**
   * Retrieve all secrets sorted by newest first (for Admin)
   */
  async getAllSecretsAdmin() {
    const queryText = 'SELECT * FROM secrets ORDER BY created_at DESC;';
    const { rows } = await pool.query(queryText);
    return rows.map(row => ({
      id: row.id,
      text: row.content,
      createdAt: row.created_at,
      status: row.status,
      reportCount: row.report_count
    }));
  },

  /**
   * Retrieve a single active secret by numeric ID
   */
  async getSecretById(id) {
    const numericId = Number(id);
    const queryText = "SELECT * FROM secrets WHERE id = $1 AND status = 'active';";
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
   * Retrieve a random active secret from the data store
   */
  async getRandomSecret() {
    const queryText = "SELECT * FROM secrets WHERE status = 'active' ORDER BY RANDOM() LIMIT 1;";
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
   * Report a secret by ID
   */
  async reportSecret(id) {
    const numericId = Number(id);
    const queryText = "UPDATE secrets SET report_count = report_count + 1 WHERE id = $1 AND status = 'active' RETURNING *;";
    const { rows } = await pool.query(queryText, [numericId]);
    return rows.length > 0;
  },

  /**
   * Hide a secret by ID (Admin)
   */
  async hideSecret(id) {
    const numericId = Number(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const queryText = "UPDATE secrets SET status = 'hidden' WHERE id = $1 RETURNING *;";
      const { rows } = await client.query(queryText, [numericId]);

      if (rows.length > 0) {
        await client.query("INSERT INTO moderation_logs (action, secret_id) VALUES ('hide', $1)", [numericId]);
      }

      await client.query('COMMIT');
      return rows.length > 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Restore a secret by ID (Admin)
   */
  async restoreSecret(id) {
    const numericId = Number(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const queryText = "UPDATE secrets SET status = 'active', report_count = 0 WHERE id = $1 RETURNING *;";
      const { rows } = await client.query(queryText, [numericId]);

      if (rows.length > 0) {
        await client.query("INSERT INTO moderation_logs (action, secret_id) VALUES ('restore', $1)", [numericId]);
      }

      await client.query('COMMIT');
      return rows.length > 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  /**
   * Delete a secret by ID (Soft delete - Admin)
   */
  async deleteSecret(id) {
    const numericId = Number(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const queryText = "UPDATE secrets SET status = 'deleted' WHERE id = $1 RETURNING *;";
      const { rows } = await client.query(queryText, [numericId]);

      if (rows.length > 0) {
        await client.query("INSERT INTO moderation_logs (action, secret_id) VALUES ('delete', $1)", [numericId]);
      }

      await client.query('COMMIT');
      return rows.length > 0;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
