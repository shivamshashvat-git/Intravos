import invoicesController from './invoices.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireSecondary, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { financialBlinder } from '../../../core/middleware/financialBlinder.js';

const router = express.Router();

router.use(financialBlinder);

// ── ZOD SCHEMAS ──
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  sac_code: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  gst_rate: z.number().min(0).optional(),
});

const invoiceCreateSchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_address: z.string().optional(),
  customer_gstin: z.string().optional(),
  place_of_supply: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
  gst_type: z.enum(['cgst_sgst', 'igst']).optional(),
  invoice_type: z.enum(['tax_invoice', 'proforma_invoice', 'receipt', 'credit_note']).optional(),
  payment_terms: z.string().optional(),
  due_date: z.string().optional(),
});

const creditNoteSchema = z.object({
  credit_reason: z.string().min(1, 'Credit reason is required'),
  items: z.array(invoiceItemSchema).optional(),
});

// ── LIST & SUMMARY ──
router.get('/', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.listInvoices(req, res, next)));
router.get('/gst-summary', authenticate, requireSecondary(), requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.getGstSummary(req, res, next)));
router.get('/export/gstr1', authenticate, requireSecondary(), requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.getGstr1Export(req, res, next)));

// ── PUBLIC SHARE ──
router.get('/share/:token', asyncHandler((req, res, next) => invoicesController.getPublicInvoiceShare(req, res, next)));

// ── DETAIL ──
router.get('/:id', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.getInvoiceById(req, res, next)));
router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.getInvoicePdf(req, res, next)));

// ── ACTIONS ──
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), validate(invoiceCreateSchema), asyncHandler((req, res, next) => invoicesController.createInvoice(req, res, next)));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.updateInvoice(req, res, next)));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res, next) => invoicesController.deleteInvoice(req, res, next)));
router.post('/:id/recalculate', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => invoicesController.recalculateInvoice(req, res, next)));

export default router;
