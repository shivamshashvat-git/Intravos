import customersController from './customers.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── ZOD SCHEMAS ──
const customerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// ── CUSTOMER MERGE ──
// POST /api/customers/merge/preview
router.post('/merge/preview', authenticate, requireAdmin(), requireFeature('customers'), asyncHandler((req, res) => customersController.getMergePreview(req, res)));

// POST /api/customers/merge
router.post('/merge', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.mergeCustomers(req, res)));

// GET /api/customers/merge/logs
router.get('/merge/logs', authenticate, requireAdmin(), requireFeature('customers'), asyncHandler((req, res) => customersController.getMergeLogs(req, res)));

// ── CORE CRM ──

// GET /api/customers
router.get('/', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.listCustomers(req, res)));

// GET /api/customers/:id
router.get('/:id', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerById(req, res)));

// POST /api/customers
router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(customerCreateSchema), asyncHandler((req, res) => customersController.createCustomer(req, res)));

// PATCH /api/customers/:id
router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.updateCustomer(req, res)));

// DELETE /api/customers/:id
router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.deleteCustomer(req, res)));

// ── PRIVACY (GDPR) ──
// POST /api/customers/:id/privacy/revoke
router.post('/:id/privacy/revoke', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res, next) => customersController.revokePrivacyConsent(req, res, next)));

// ── TRAVELERS ──
// POST /api/customers/:id/travelers
router.post('/:id/travelers', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.addTraveler(req, res)));

// GET /api/customers/:id/travelers
router.get('/:id/travelers', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getTravelers(req, res)));

// ── RELATIONS & TIMELINE ──

router.get('/:id/timeline', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerTimeline(req, res)));
router.get('/:id/bookings', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerBookings(req, res)));
router.get('/:id/quotations', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerQuotations(req, res)));
router.get('/:id/invoices', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerInvoices(req, res)));
router.get('/:id/visas', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerVisas(req, res)));
router.get('/:id/documents', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.getCustomerDocuments(req, res)));

export default router;
