import express from 'express';
import salesController from './sales.controller.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireSuperAdmin } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// Public inquiry submission
// POST /api/sales/inquire
router.post('/inquire', asyncHandler((req, res) => salesController.post_inquire(req, res)));

// Super Admin Management
// GET /api/sales/inquiries
router.get('/inquiries', authenticate, requireSuperAdmin(), asyncHandler((req, res) => salesController.get_inquiries(req, res)));

// PATCH /api/sales/inquiries/:id
router.patch('/inquiries/:id', authenticate, requireSuperAdmin(), asyncHandler((req, res) => salesController.patch_inquiry_status(req, res)));

export default router;
