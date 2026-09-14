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

// POST /api/secrets/:id/report - Report a secret
router.post('/:id/report', secretController.reportSecret);

// (The DELETE route is now protected and moved to adminRoutes.js,
// removing public delete route to enforce admin-only deletions)

export default router;
