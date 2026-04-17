import groupbookingsController from './group-bookings.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireStaff, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.post('/:bookingId/members', authenticate, requireStaff(), requireWriteAccess, requireFeature('group_bookings'), asyncHandler((req, res, next) => groupbookingsController.post_bookingId_members_1(req, res, next)));;

router.put('/:bookingId/members/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('group_bookings'), asyncHandler((req, res, next) => groupbookingsController.put_id_member(req, res, next)));;

router.post('/:bookingId/calculate', authenticate, requireAdmin(), requireWriteAccess, requireFeature('group_bookings'), asyncHandler((req, res, next) => groupbookingsController.post_bookingId_calculate_2(req, res, next)));;

router.post('/:bookingId/generate-invoices', authenticate, requireAdmin(), requireWriteAccess, requireFeature('group_bookings'), asyncHandler((req, res, next) => groupbookingsController.post_bookingId_generate_invoices_3(req, res, next)));;

export default router;
