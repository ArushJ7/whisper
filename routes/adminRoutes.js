import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { secretController } from '../controllers/secretController.js';

const router = express.Router();

// Admin Authentication
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);

// Protected Admin Secret Actions
router.get('/secrets', requireAdmin, secretController.getAllSecretsAdmin);
router.patch('/secrets/:id/hide', requireAdmin, secretController.hideSecret);
router.patch('/secrets/:id/restore', requireAdmin, secretController.restoreSecret);
router.delete('/secrets/:id', requireAdmin, secretController.deleteSecret);

export default router;
