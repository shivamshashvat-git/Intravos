import paymentsController from './payments.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { requireSudo } from '../../../core/middleware/sudo.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

function toAmount(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nextInvoiceStatus(invoice, amountPaid) {
  if (!invoice || invoice.status === 'cancelled') return invoice?.status || 'draft';
  if (amountPaid <= 0) return invoice.status || 'draft';
  if (amountPaid >= toAmount(invoice.total)) return 'paid';
  return 'partially_paid';
}

function nextSupplierPaymentStatus(service, paidAmount) {
  const expected = toAmount(service?.cost_to_agency);
  if (paidAmount <= 0) return 'unpaid';
  if (expected > 0 && paidAmount >= expected) return 'fully_paid';
  return 'partially_paid';
}

router.get('/', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get__0(req, res, next)));;

router.post('/record', authenticate, requireStaff(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.post_record_1(req, res, next)));;

router.post('/supplier', authenticate, requireStaff(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.post_supplier_2(req, res, next)));;

router.get('/outstanding', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get_outstanding_3(req, res, next)));;

router.get('/supplier-payables', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get_supplier_payables_4(req, res, next)));;

router.get('/reminder-url', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get_reminder_url_5(req, res, next)));;

router.get('/accounts', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get_accounts_6(req, res, next)));;

router.post('/accounts', authenticate, requireAdmin(), requireSudo, requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.post_accounts_7(req, res, next)));;

router.patch('/accounts/:id', authenticate, requireAdmin(), requireSudo, requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.patch_accounts__id_8(req, res, next)));;

router.get('/:id/receipt', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.get_id_receipt_9(req, res, next)));;

export default router;
