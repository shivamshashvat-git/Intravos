import paymentsController from './payments.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { requireSudo } from '../../../core/middleware/sudo.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.listTransactions(req, res, next)));

router.post('/record', authenticate, requireStaff(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.recordCustomerPayment(req, res, next)));

router.post('/supplier', authenticate, requireStaff(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.recordSupplierPayment(req, res, next)));

router.get('/accounts', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.listBankAccounts(req, res, next)));

router.get('/:id/receipt', authenticate, requireStaff(), requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.getPaymentReceiptPdf(req, res, next)));

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.updatePayment(req, res, next)));

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('payments'), asyncHandler((req, res, next) => paymentsController.deletePayment(req, res, next)));

export default router;
