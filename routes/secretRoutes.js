import express from 'express';
import { secretController } from '../controllers/secretController.js';

const router = express.Router();

// GET /api/secrets - Return all secrets
router.get('/', secretController.getSecrets);

// GET /api/secrets/random - Return one random secret (placed before :id route)
router.get('/random', secretController.getRandomSecret);

// GET /api/secrets/:id - Return a specific secret by ID
router.get('/:id', secretController.getSecretById);

// POST /api/secrets - Create a new secret
router.post('/', secretController.createSecret);

// DELETE /api/secrets/:id - Delete a secret
router.delete('/:id', secretController.deleteSecret);

export default router;
