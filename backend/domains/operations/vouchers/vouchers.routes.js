
import express from 'express';
import vouchersController from './vouchers.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { validate } from '../../../core/middleware/validate.js';
import { createVoucherSchema, updateVoucherSchema } from './vouchers.schema.js';

const router = express.Router();

// List & Create
router.get('/', authenticate, requireStaff(), requireFeature('vouchers'), asyncHandler(vouchersController.listVouchers));
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('vouchers'), validate(createVoucherSchema), asyncHandler(vouchersController.createVoucher));

// Lifecycle
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('vouchers'), validate(updateVoucherSchema), asyncHandler(vouchersController.updateVoucher));
router.delete('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('vouchers'), asyncHandler(vouchersController.deleteVoucher));

// PDF
router.post('/:id/pdf', authenticate, requireStaff(), requireFeature('vouchers'), asyncHandler(vouchersController.generateVoucherPdf));

export default router;
