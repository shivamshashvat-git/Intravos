import announcementsController from './announcements.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireSecondary } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), asyncHandler((req, res, next) => announcementsController.get__0(req, res, next)));
router.post('/', authenticate, requireSecondary(), asyncHandler((req, res, next) => announcementsController.post__0(req, res, next)));
router.post('/:id/dismiss', authenticate, requireStaff(), asyncHandler((req, res, next) => announcementsController.post_id_dismiss_1(req, res, next)));;

export default router;
