import { secretService } from '../services/secretService.js';

export const secretController = {
  /**
   * GET /api/secrets
   * Return all secrets
   */
  async getSecrets(req, res, next) {
    try {
      const allSecrets = await secretService.getAllSecrets();
      res.status(200).json({
        success: true,
        count: allSecrets.length,
        data: allSecrets
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/secrets/random
   * Return one randomly selected secret
   */
  async getRandomSecret(req, res, next) {
    try {
      const randomSecret = await secretService.getRandomSecret();
      if (!randomSecret) {
        return res.status(404).json({
          success: false,
          error: "No secrets available."
        });
      }
      res.status(200).json({
        success: true,
        data: randomSecret
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/secrets/:id
   * Return a specific secret by ID
   */
  async getSecretById(req, res, next) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);

      if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid secret ID format."
        });
      }

      const secret = await secretService.getSecretById(numericId);
      if (!secret) {
        return res.status(404).json({
          success: false,
          error: `Secret with ID ${numericId} was not found.`
        });
      }

      res.status(200).json({
        success: true,
        data: secret
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/secrets
   * Create a new anonymous secret
   */
  async createSecret(req, res, next) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: "Secret text is required and must be a string."
        });
      }

      const trimmedText = text.trim();

      if (trimmedText.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Secret text cannot be empty."
        });
      }

      if (trimmedText.length < 3) {
        return res.status(400).json({
          success: false,
          error: "Secret must be at least 3 characters long."
        });
      }

      const MAX_LENGTH = 500;
      if (trimmedText.length > MAX_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Secret exceeds maximum allowed length of ${MAX_LENGTH} characters.`
        });
      }

      const newSecret = await secretService.createSecret(trimmedText);

      res.status(201).json({
        success: true,
        message: "Secret created successfully.",
        data: newSecret
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/secrets/:id
   * Delete a secret by ID
   */
  async deleteSecret(req, res, next) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id, 10);

      if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid secret ID format."
        });
      }

      const deleted = await secretService.deleteSecret(numericId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Secret with ID ${numericId} could not be found.`
        });
      }

      res.status(200).json({
        success: true,
        message: `Secret #${numericId} deleted successfully.`,
        deletedId: numericId
      });
    } catch (error) {
      next(error);
    }
  }
};
