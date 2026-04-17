import directoryController from './directory.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';
import { routeCache } from '../../../core/middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/payment-calendar', authenticate, requireStaff(), requireFeature('directory'), routeCache(120), asyncHandler((req, res, next) => directoryController.get_payment_calendar_0(req, res, next)));

router.get('/', authenticate, requireStaff(), requireFeature('directory'), routeCache(300), asyncHandler((req, res, next) => directoryController.get__1(req, res, next)));

router.get('/:id', authenticate, requireStaff(), requireFeature('directory'), routeCache(300), asyncHandler((req, res, next) => directoryController.get_id_2(req, res, next)));

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('directory'), asyncHandler((req, res, next) => directoryController.post__3(req, res, next)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('directory'), asyncHandler((req, res, next) => directoryController.patch_id_4(req, res, next)));;

router.post('/:id/rate-cards', authenticate, requireStaff(), requireWriteAccess, requireFeature('directory'), asyncHandler((req, res, next) => directoryController.post_id_rate_cards_5(req, res, next)));;

router.delete('/:id/rate-cards/:cardId', authenticate, requireStaff(), requireWriteAccess, requireFeature('directory'), asyncHandler((req, res, next) => directoryController.delete_id_rate_cards__cardId_6(req, res, next)));;

router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('directory'), asyncHandler((req, res, next) => directoryController.delete_id_7(req, res, next)));;

export default router;
