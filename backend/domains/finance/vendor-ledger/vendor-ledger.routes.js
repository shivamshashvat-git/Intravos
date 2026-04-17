import vendorledgerController from './vendor-ledger.controller.js';
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

router.get('/', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorledgerController.get__0(req, res, next)));;

router.get('/dashboard', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorledgerController.get_dashboard_1(req, res, next)));;

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorledgerController.post__2(req, res, next)));;

router.patch('/:id/mark-paid', authenticate, requireAdmin(), requireWriteAccess, requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorledgerController.patch_id_mark_paid_3(req, res, next)));

router.get('/supplier/:supplierId/balance', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorledgerController.get_supplier__supplierId_balance_4(req, res, next)));

export default router;
