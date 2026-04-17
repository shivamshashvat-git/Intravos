import resourcesController from './resources.controller.js';
import express from 'express';
import { requireFeature, requireVisibleFeature } from '../../../core/middleware/featureFlag.js';

import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin,
  requireStaff,
  requireWriteAccess } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.use(authenticate, requireStaff(), requireFeature('resource_hub'), requireVisibleFeature('resource_hub'));

router.get('/categories', asyncHandler((req, res, next) => resourcesController.get_categories_0(req, res, next)));;

router.get('/', asyncHandler((req, res, next) => resourcesController.get__1(req, res, next)));;

router.post('/', requireWriteAccess, asyncHandler((req, res, next) => resourcesController.post__2(req, res, next)));;

router.patch('/:id', requireWriteAccess, asyncHandler((req, res, next) => resourcesController.patch_id_3(req, res, next)));;

router.post('/:id/use', asyncHandler((req, res, next) => resourcesController.post_id_use_4(req, res, next)));;

router.delete('/:id', requireAdmin(), requireWriteAccess, asyncHandler((req, res, next) => resourcesController.delete_id_5(req, res, next)));;

export default router;
