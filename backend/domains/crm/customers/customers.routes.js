import customersController from './customers.controller.js';
import express from 'express';
import { validate } from '../../../core/middleware/validate.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';
import { 
  customerCreateSchema, 
  customerUpdateSchema, 
  associatedTravelerSchema,
  messageTemplateSchema,
  feedbackRequestSchema,
  feedbackSubmitSchema,
  referralSchema 
} from './customers.schema.js';

const router = express.Router();

// ── CUSTOMER ANALYTICS & DEDUP ──

// GET /api/v1/crm/customers/duplicate-phones
router.get('/duplicate-phones', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getDuplicatePhones(req, res, next)));

// GET /api/v1/crm/customers/engagement/birthdays
router.get('/engagement/birthdays', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getUpcomingBirthdays(req, res, next)));

// GET /api/v1/crm/customers/engagement/anniversaries
router.get('/engagement/anniversaries', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getUpcomingAnniversaries(req, res, next)));

// GET /api/v1/crm/customers/engagement/dormant
router.get('/engagement/dormant', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getDormantCustomers(req, res, next)));

// ── CORE CRM ──

// GET /api/v1/crm/customers
router.get('/', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.listCustomers(req, res, next)));

// POST /api/v1/crm/customers
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(customerCreateSchema), asyncHandler((req, res, next) => customersController.createCustomer(req, res, next)));

// GET /api/v1/crm/customers/:id
router.get('/:id', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getCustomerById(req, res, next)));

// PATCH /api/v1/crm/customers/:id
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(customerUpdateSchema), asyncHandler((req, res, next) => customersController.updateCustomer(req, res, next)));

// DELETE /api/v1/crm/customers/:id
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res, next) => customersController.deleteCustomer(req, res, next)));

// ── TRAVELERS ──
// GET /api/v1/crm/customers/:id/travelers
router.get('/:id/travelers', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getTravelers(req, res, next)));

// POST /api/v1/crm/customers/:id/travelers
router.post('/:id/travelers', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(associatedTravelerSchema), asyncHandler((req, res, next) => customersController.addTraveler(req, res, next)));

// ── MESSAGE TEMPLATES ──
// GET /api/v1/crm/message-templates
router.get('/config/templates', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.listMessageTemplates(req, res, next)));

// POST /api/v1/crm/message-templates
router.post('/config/templates', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(messageTemplateSchema), asyncHandler((req, res, next) => customersController.createMessageTemplate(req, res, next)));

// PATCH /api/v1/crm/message-templates/:id
router.patch('/config/templates/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(messageTemplateSchema.partial()), asyncHandler((req, res, next) => customersController.updateMessageTemplate(req, res, next)));

// DELETE /api/v1/crm/message-templates/:id
router.delete('/config/templates/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res, next) => customersController.deleteMessageTemplate(req, res, next)));

// ── FEEDBACK & REFERRALS ──

// POST /api/v1/crm/feedback (Initiate request)
router.post('/feedback/request', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(feedbackRequestSchema), asyncHandler((req, res, next) => customersController.requestFeedback(req, res, next)));

// GET /api/v1/crm/referrals
router.get('/referrals/all', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.listReferrals(req, res, next)));

// POST /api/v1/crm/referrals
router.post('/referrals', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(referralSchema), asyncHandler((req, res, next) => customersController.createReferral(req, res, next)));

// PATCH /api/v1/crm/referrals/:id
router.patch('/referrals/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(referralSchema.partial()), asyncHandler((req, res, next) => customersController.updateReferral(req, res, next)));

// ── RELATIONS ──
router.get('/:id/bookings', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getCustomerBookings(req, res, next)));
router.get('/:id/quotations', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getCustomerQuotations(req, res, next)));
router.get('/:id/invoices', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res, next) => customersController.getCustomerInvoices(req, res, next)));

export default router;
