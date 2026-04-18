import quotationsController from './quotations.controller.js';
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

// GET /api/quotations — list quotations
router.get('/', authenticate, requireStaff(), requireFeature('quotations'), asyncHandler((req, res) => quotationsController.get__0(req, res)));;

// GET /api/quotations/:id — single quotation with line items
router.get('/:id', authenticate, requireStaff(), asyncHandler((req, res) => quotationsController.get_id_1(req, res)));;

router.get('/:id/pdf', authenticate, requireStaff(), requireFeature('quotations'), asyncHandler((req, res) => quotationsController.get_id_pdf_2(req, res)));;

// POST /api/quotations — create quotation from lead
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('quotations'), asyncHandler((req, res) => quotationsController.post__3(req, res)));;

// PATCH /api/quotations/:id — update status
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res) => quotationsController.patch_id_4(req, res)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('quotations'), asyncHandler((req, res) => quotationsController.delete_id_5(req, res)));;

// POST /api/quotations/:id/revise — create a new version
router.post('/:id/revise', authenticate, requireStaff(), requireWriteAccess, asyncHandler((req, res) => quotationsController.post_id_revise_6(req, res)));;

// POST /api/quotations/:id/convert-to-invoice — create invoice from accepted quotation
router.post('/:id/convert-to-invoice', authenticate, requireStaff(), requireWriteAccess, requireFeature('invoicing'), asyncHandler((req, res) => quotationsController.post_id_convert_to_invoice_7(req, res)));;

// POST /api/quotations/:id/duplicate — clone a quotation as new draft
router.post('/:id/duplicate', authenticate, requireStaff(), requireWriteAccess, requireFeature('quotations'), asyncHandler((req, res) => quotationsController.post_id_duplicate_9(req, res)));

export default router;
