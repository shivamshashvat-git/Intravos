import invoicesController from './invoices.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

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
router.get('/', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.listInvoices(req, res)));
router.get('/audit', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getInvoiceAuditTrail(req, res)));
router.get('/gst-summary', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getGstSummary(req, res)));
router.get('/export/gstr1', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getGstr1Export(req, res)));

// ── PUBLIC SHARE ──
router.get('/share/:token', asyncHandler((req, res) => invoicesController.getPublicInvoiceShare(req, res)));

// ── DETAIL ──
router.get('/:id', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getInvoiceById(req, res)));
router.get('/:id/pdf-data', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getInvoicePdfData(req, res)));
router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.getInvoicePdf(req, res)));

// ── ACTIONS ──
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), validate(invoiceCreateSchema), asyncHandler((req, res) => invoicesController.createInvoice(req, res)));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.updateInvoice(req, res)));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.deleteInvoice(req, res)));
router.post('/:id/credit-note', authenticate, requireAdmin(), requireWriteAccess, requireFeature('invoicing'), validate(creditNoteSchema), asyncHandler((req, res) => invoicesController.createCreditNote(req, res)));
router.post('/:id/create-payment-link', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.createPaymentLink(req, res)));

export default router;
