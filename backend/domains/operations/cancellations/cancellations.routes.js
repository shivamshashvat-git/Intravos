import cancellationsController from './cancellations.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

function toAmount(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function refundGap(payload) {
  return Math.max(0, toAmount(payload.refund_amount_vendor) - toAmount(payload.refund_received_vendor));
}

router.get('/', authenticate, requireAdmin(), requireFeature('cancellations'), asyncHandler((req, res, next) => cancellationsController.get__0(req, res, next)));;

router.get('/refund-tracker', authenticate, requireAdmin(), requireFeature('cancellations'), asyncHandler((req, res, next) => cancellationsController.get_refund_tracker_1(req, res, next)));;

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler((req, res, next) => cancellationsController.post__2(req, res, next)));;

router.patch('/:id/status', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler((req, res, next) => cancellationsController.patch_id_status_3(req, res, next)));;

router.patch('/:id/refund-received', authenticate, requireAdmin(), requireWriteAccess, requireFeature('cancellations'), asyncHandler((req, res, next) => cancellationsController.patch_id_refund_received_4(req, res, next)));;

export default router;
