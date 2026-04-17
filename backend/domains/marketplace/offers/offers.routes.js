import offersController from './offers.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

// GET /api/offers/public/:slug — no auth (slug = tenant slug for website package listing)
router.get('/public/:slug', asyncHandler((req, res, next) => offersController.get_public__slug_0(req, res, next)));;

router.get('/', authenticate, requireStaff(), requireFeature('offers'), asyncHandler((req, res, next) => offersController.get__1(req, res, next)));;

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('offers'), asyncHandler((req, res, next) => offersController.post__2(req, res, next)));;

router.patch('/reorder', authenticate, requireStaff(), requireWriteAccess, requireFeature('offers'), asyncHandler((req, res, next) => offersController.patch_reorder_3(req, res, next)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('offers'), asyncHandler((req, res, next) => offersController.patch_id_4(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('offers'), asyncHandler((req, res, next) => offersController.delete_id_5(req, res, next)));;

export default router;
