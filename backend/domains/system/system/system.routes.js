// backend/modules/system/system.routes.js
import express from 'express';
import systemController from './system.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/settings', authenticate, requireAdmin(), asyncHandler((req, res) => systemController.get_settings(req, res)));
router.patch('/settings', authenticate, requireAdmin(), asyncHandler((req, res) => systemController.patch_settings(req, res)));

export default router;
