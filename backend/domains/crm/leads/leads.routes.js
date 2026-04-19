import leadsController from './leads.controller.js';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { authenticate, authenticateApiKey  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireSecondary, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { 
  leadCreateSchema, 
  leadUpdateSchema, 
  leadNoteSchema, 
  leadFollowupSchema, 
  leadAssignSchema 
} from './leads.schema.js';

const router = express.Router();

// ── PUBLIC LEAD CREATION (from website forms) ──
// POST /api/leads/public
router.post('/public', authenticateApiKey, asyncHandler((req, res, next) => leadsController.createPublicLead(req, res, next)));

// ── AUTHENTICATED LEAD ROUTES ──

// GET /api/leads/analytics — CRM Pipeline Insights (Must be before /:id)
router.get('/analytics', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getAnalytics(req, res, next)));

// GET /api/leads — list leads with filters
router.get('/', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.listLeads(req, res, next)));

// GET /api/leads/:id — single lead with all related data
router.get('/:id', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getLeadById(req, res, next)));

// POST /api/leads — create lead (authenticated, manual entry)
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), validate(leadCreateSchema), asyncHandler((req, res, next) => leadsController.createLead(req, res, next)));

// PATCH /api/leads/:id — update lead
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), validate(leadUpdateSchema), asyncHandler((req, res, next) => leadsController.updateLead(req, res, next)));

// DELETE /api/leads/:id — soft delete lead
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.deleteLead(req, res, next)));

// ── LEAD NOTES ──

// GET /api/leads/:id/notes
router.get('/:id/notes', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getLeadNotes(req, res, next)));

// POST /api/leads/:id/notes
router.post('/:id/notes', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), validate(leadNoteSchema), asyncHandler((req, res, next) => leadsController.addLeadNote(req, res, next)));

// ── LEAD FOLLOW-UPS ──

// GET /api/leads/:id/followups
router.get('/:id/followups', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getLeadFollowups(req, res, next)));

// POST /api/leads/:id/followups
router.post('/:id/followups', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), validate(leadFollowupSchema), asyncHandler((req, res, next) => leadsController.addLeadFollowup(req, res, next)));

// ── LEAD COMMUNICATIONS ──

// POST /api/leads/:id/communications
router.post('/:id/communications', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.recordLeadCommunication(req, res, next)));

// ── DOCUMENTS & ATTACHMENTS ──

router.get('/:id/attachments', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getLeadAttachments(req, res, next)));
router.get('/:id/documents', authenticate, requireStaff(), requireFeature('leads'), asyncHandler((req, res, next) => leadsController.getLeadDocuments(req, res, next)));
router.post('/:id/documents', authenticate, requireStaff(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.uploadLeadDocument(req, res, next)));

// ── LEAD REASSIGNMENT ──

router.post('/:id/assign', authenticate, requireSecondary(), requireWriteAccess, requireFeature('leads'), validate(leadAssignSchema), asyncHandler((req, res, next) => leadsController.assignLead(req, res, next)));

// ── BULK OPERATIONS ──

router.post('/bulk-assign', authenticate, requireSecondary(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.bulkAssignLeads(req, res, next)));
router.post('/bulk-status', authenticate, requireSecondary(), requireWriteAccess, requireFeature('leads'), asyncHandler((req, res, next) => leadsController.bulkUpdateLeadStatus(req, res, next)));

export default router;
