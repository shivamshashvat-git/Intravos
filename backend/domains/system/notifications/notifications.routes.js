import express from 'express';
import notificationsController from './notifications.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// All notification routes require staff authentication and unified error handling
router.use(authenticate, requireStaff());

router.get('/', asyncHandler((req, res) => notificationsController.get_all(req, res)));
router.patch('/read-all', asyncHandler((req, res) => notificationsController.patch_read_all(req, res)));
router.patch('/:id/read', asyncHandler((req, res) => notificationsController.patch_read(req, res)));

export default router;
