import markuppresetsController from './markup-presets.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('markup_presets'), asyncHandler((req, res, next) => markuppresetsController.get__0(req, res, next)));;

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markuppresetsController.post__1(req, res, next)));;

router.patch('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markuppresetsController.patch_id_2(req, res, next)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('markup_presets'), asyncHandler((req, res, next) => markuppresetsController.delete_id_3(req, res, next)));;

export default router;
