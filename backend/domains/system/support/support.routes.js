import supportController from './support.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireSuperAdmin  } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

router.get('/tickets', authenticate, requireStaff(), asyncHandler((req, res, next) => supportController.get_tickets_0(req, res, next)));;

router.get('/tickets/:id', authenticate, requireStaff(), asyncHandler((req, res, next) => supportController.get_tickets__id_1(req, res, next)));;

router.post('/tickets', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => supportController.post_tickets_2(req, res, next)));;

router.post('/tickets/:id/reply', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => supportController.post_tickets__id_reply_3(req, res, next)));;

router.patch('/tickets/:id/resolve', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => supportController.patch_tickets__id_resolve_4(req, res, next)));;

router.delete('/tickets/:id', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => supportController.delete_tickets__id_5(req, res, next)));;

router.get('/feature-requests', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => supportController.get_feature_requests_6(req, res, next)));;

export default router;
