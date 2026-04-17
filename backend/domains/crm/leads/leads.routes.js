import leadsController from './leads.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { supabaseAdmin, supabaseForUser  } from '../../../providers/database/supabase.js';
import { authenticate, authenticateApiKey  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

const router = express.Router();

// ── ZOD SCHEMAS ──
const leadPublicSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().min(1, "Phone is required"),
  customer_email: z.string().email().optional().or(z.literal('')),
  destination: z.string().optional(),
  hotel_name: z.string().optional(),
  location: z.string().optional(),
  checkin_date: z.string().optional(),
  checkout_date: z.string().optional(),
  guests: z.number().int().positive().optional(),
  rooms: z.number().int().positive().optional(),
  price_seen: z.number().optional(),
  source: z.enum(['website', 'referral', 'agent', 'network', 'campaign']).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

const leadCreateSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").optional(),
  customer_phone: z.string().min(1, "Phone is required").optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_id: z.string().uuid().optional(),
  destination: z.string().optional(),
  checkin_date: z.string().optional(),
  checkout_date: z.string().optional(),
  guests: z.number().int().positive().optional(),
  rooms: z.number().int().positive().optional(),
  source: z.enum(['manual', 'website', 'referral', 'agent', 'network', 'campaign']).optional(),
  assigned_to: z.string().uuid().optional(),
  tags: z.array(z.string()).optional()
}).refine(data => data.customer_id || (data.customer_name && data.customer_phone), {
  message: "Either customer_id or (customer_name + customer_phone) must be provided."
});


// ── PUBLIC LEAD CREATION (from website forms) ──
// POST /api/leads/public
router.post('/public', authenticateApiKey, validate(leadPublicSchema), asyncHandler((req, res) => leadsController.post_public_0(req, res)));;

// ── AUTHENTICATED LEAD ROUTES ──

// GET /api/leads — list leads with filters
router.get('/', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get__1(req, res)));;

// GET /api/leads/:id — single lead with all related data
router.get('/:id', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get_id_2(req, res)));;

router.get('/:id/booking-confirmation/pdf', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get_id_booking_confirmation_pdf_3(req, res)));;

// POST /api/leads — create lead (authenticated, manual entry)
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.post__4(req, res)));;

// PATCH /api/leads/:id — update lead
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.patch_id_5(req, res)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.delete_id_6(req, res)));;

router.get('/:id/modifications', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get_id_modifications_7(req, res)));;

// ── LEAD NOTES ──

// POST /api/leads/:id/notes
router.post('/:id/notes', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.post_id_notes_8(req, res)));;

// ── LEAD COMMUNICATIONS ──

// POST /api/leads/:id/communications
router.post('/:id/communications', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.post_id_communications_9(req, res)));;

// ── WHATSAPP SHARE URLs ──

// GET /api/leads/:id/share-urls
router.get('/:id/share-urls', authenticate, requireStaff(), asyncHandler((req, res) => leadsController.get_id_share_urls_10(req, res)));;

// ── LEAD ATTACHMENTS ──

// GET /api/leads/:id/attachments
router.get('/:id/attachments', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get_id_attachments_11(req, res)));;

router.get('/:id/documents', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res) => leadsController.get_id_documents_12(req, res)));;

router.post('/:id/documents', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.post_id_documents_13(req, res)));;

router.patch('/:id/documents/:documentId', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.patch_id_documents__documentId_14(req, res)));;

// DELETE /api/leads/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res) => leadsController.delete_id_attachments__attachmentId_15(req, res)));

// ── LEAD REASSIGNMENT ──

// POST /api/leads/:id/assign — dedicated reassignment with full audit trail
router.post('/:id/assign', authenticate, requireAdmin(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.post_id_assign_15(req, res, next)));

// ── BULK OPERATIONS ──

// POST /api/leads/bulk-assign — assign multiple leads to a staff member
router.post('/bulk-assign', authenticate, requireAdmin(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.post_bulk_assign_16(req, res, next)));

// POST /api/leads/bulk-status — change status of multiple leads
router.post('/bulk-status', authenticate, requireAdmin(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.post_bulk_status_17(req, res, next)));

export default router;
