import quotationsController from './quotations.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import { financialBlinder } from '../../../core/middleware/financialBlinder.js';

const router = express.Router();

router.use(financialBlinder);

// ── ZOD SCHEMAS ──
const quotationItemSchema = z.object({
  type: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  sac_code: z.string().optional(),
  amount: z.number().min(0),
  cost_price: z.number().min(0).optional(),
  gst_rate: z.number().min(0).optional(),
});

const quotationCreateSchema = z.object({
  lead_id: z.string().uuid("Invalid Lead ID"),
  items: z.array(quotationItemSchema).min(1, 'At least one line item is required'),
  gst_rate: z.number().min(0).optional(),
  gst_type: z.enum(['cgst_sgst', 'igst']).optional(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
  terms: z.string().optional(),
  valid_until: z.string().optional(),
});

async function fetchQuotationWithItems(tenantId, quotationId, { includeLead = false } = {}) {
  const quoteSelect = includeLead
    ? '*, leads(id, customer_name, destination, status)'
    : '*';

  const { data: quotation, error } = await supabaseAdmin
    .from('quotations')
    .select(quoteSelect)
    .eq('id', quotationId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!quotation) return null;

  const { data: items, error: itemError } = await supabaseAdmin
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', quotationId)
    .is('deleted_at', null)
    .order('sort_order');

  if (itemError) throw itemError;

  return {
    ...quotation,
    quotation_items: items || [] };
}

// GET /api/quotations/share/:token — public endpoint for customer viewing
router.get('/share/:token', asyncHandler((req, res) => quotationsController.get_share__token_8(req, res)));

// ── LIST ──
router.get('/', authenticate, requireStaff(), requireFeature('quotations'), asyncHandler((req, res, next) => quotationsController.listQuotations(req, res, next)));

// ── ACTIONS ──
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('quotations'), validate(quotationCreateSchema), asyncHandler((req, res, next) => quotationsController.createQuotation(req, res, next)));

// ── DETAIL & MUTATIONS ──
router.get('/:id', authenticate, requireStaff(), asyncHandler((req, res, next) => quotationsController.getQuotationById(req, res, next)));
router.get('/:id/pdf', authenticate, requireStaff(), asyncHandler((req, res, next) => quotationsController.getQuotationPdf(req, res, next)));
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => quotationsController.updateQuotation(req, res, next)));
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('quotations'), asyncHandler((req, res, next) => quotationsController.deleteQuotation(req, res, next)));

// ── WORKFLOWS ──
router.post('/:id/revise', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res, next) => quotationsController.reviseQuotation(req, res, next)));
router.post('/:id/convert', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res, next) => quotationsController.convertToInvoice(req, res, next)));
router.post('/:id/duplicate', authenticate, requireStaff(), requireWriteAccess, requireFeature('quotations'), asyncHandler((req, res, next) => quotationsController.duplicateQuotation(req, res, next)));

export default router;
