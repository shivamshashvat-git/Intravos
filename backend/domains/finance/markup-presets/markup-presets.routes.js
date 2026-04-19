import markupPresetsController from './markup-presets.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('markup_presets'), asyncHandler((req, res, next) => markupPresetsController.listPresets(req, res, next)));

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markupPresetsController.createPreset(req, res, next)));

router.patch('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markupPresetsController.updatePreset(req, res, next)));

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markupPresetsController.deletePreset(req, res, next)));

export default router;
