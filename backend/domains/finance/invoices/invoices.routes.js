import invoicesController from './invoices.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

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

// ── HELPERS ──

function getCurrentFinancialYear() {
  const now = new Date();
  // Indian FY: April–March
  return now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`;
}

async function fetchInvoiceWithItems(tenantId, invoiceId) {
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select('*, lead:leads(final_price, vendor_cost, profit)')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!invoice) return null;

  const { data: items, error: itemError } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .is('deleted_at', null)
    .order('sort_order');

  if (itemError) throw itemError;

  return {
    ...invoice,
    invoice_items: items || [] };
}

// ── LIST ──

// GET /api/invoices
router.get('/', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get__0(req, res)));

// ── AUDIT ──
// GET /api/invoices/audit
router.get('/audit', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_audit(req, res)));

// ── GST SUMMARY ──

// GET /api/invoices/gst-summary?financial_year=2026-27&month=4
// Aggregates CGST, SGST, IGST per month for GST filing
// IMPORTANT: must be defined before /:id to avoid Express capturing 'gst-summary' as an ID
// GET /api/invoices/gst-summary?financial_year=2026-27&month=4
router.get('/gst-summary', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_gst_summary_1(req, res)));

// GET /api/invoices/export/gstr1
router.get('/export/gstr1', authenticate, requireAdmin(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_gstr1_export(req, res)));

// ── DETAIL ──

// GET /api/invoices/share/:token — public endpoint for customer viewing
router.get('/share/:token', asyncHandler((req, res) => invoicesController.get_share__token_9(req, res)));

// GET /api/invoices/:id
router.get('/:id', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_id_2(req, res)));;

// ── PDF DATA ──

// GET /api/invoices/:id/pdf-data
// Returns all structured data needed to render a PDF — no file generation here
router.get('/:id/pdf-data', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_id_pdf_data_3(req, res)));;

router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.get_id_pdf_4(req, res)));;

// ── CREATE (standalone — not from quotation) ──

// POST /api/invoices
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), validate(invoiceCreateSchema), asyncHandler((req, res) => invoicesController.post__5(req, res)));;

// ── UPDATE ──

// PATCH /api/invoices/:id
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.patch_id_6(req, res)));;

// ── SOFT DELETE ──

// DELETE /api/invoices/:id
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => invoicesController.delete_id_7(req, res)));;

// ── CREDIT NOTE ──

// POST /api/invoices/:id/credit-note
router.post('/:id/credit-note', authenticate, requireAdmin(), requireWriteAccess, requireFeature('invoicing'), validate(creditNoteSchema), asyncHandler((req, res) => invoicesController.post_id_credit_note_8(req, res)));;

export default router;
