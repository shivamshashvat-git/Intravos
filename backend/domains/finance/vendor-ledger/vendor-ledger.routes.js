import vendorLedgerController from './vendor-ledger.controller.js';
import express from 'express';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorLedgerController.listEntries(req, res, next)));

router.get('/dashboard', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorLedgerController.getDashboardSummary(req, res, next)));

router.post('/', authenticate, requireAdmin(), requireWriteAccess, requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorLedgerController.addEntry(req, res, next)));

router.patch('/:id/mark-paid', authenticate, requireAdmin(), requireWriteAccess, requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorLedgerController.markPaid(req, res, next)));

router.get('/supplier/:supplierId/balance', authenticate, requireAdmin(), requireFeature('vendor_ledger'), asyncHandler((req, res, next) => vendorLedgerController.getSupplierBalance(req, res, next)));

export default router;
