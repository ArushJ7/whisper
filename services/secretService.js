import { secrets, getNextId } from '../data/secrets.js';

/**
 * Service handling all operations on anonymous secrets.
 * Decoupled from Express req/res to enable easy migration to PostgreSQL or ORMs later.
 */
export const secretService = {
  /**
   * Retrieve all secrets sorted by newest first
   */
  async getAllSecrets() {
    return [...secrets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Retrieve a single secret by numeric ID
   */
  async getSecretById(id) {
    const numericId = Number(id);
    return secrets.find(secret => secret.id === numericId) || null;
  },

  /**
   * Retrieve a random secret from the data store
   */
  async getRandomSecret() {
    if (secrets.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * secrets.length);
    return secrets[randomIndex];
  },

  /**
   * Create a new anonymous secret
   */
  async createSecret(text) {
    const trimmedText = text.trim();
    const newSecret = {
      id: getNextId(),
      text: trimmedText,
      createdAt: new Date().toISOString()
    };
    secrets.push(newSecret);
    return newSecret;
  },

  /**
   * Delete a secret by ID
   */
  async deleteSecret(id) {
    const numericId = Number(id);
    const index = secrets.findIndex(secret => secret.id === numericId);
    if (index === -1) {
      return false;
    }
    secrets.splice(index, 1);
    return true;
  }
};
