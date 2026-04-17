import express from 'express';
import BillingService from './billing.service.js';
import response from '../../../core/utils/responseHandler.js';
import { authenticate } from '../../../core/middleware/auth.js';
import { requireAdmin, requireStaff } from '../../../core/middleware/rbac.js';
import { asyncHandler } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

/**
 * Platform Governance — Agency Management
 */

// 1. Quota Check (Staff/Admins)
router.get('/quota/:type', authenticate, requireStaff(), asyncHandler(async (req, res) => {
  const service = new BillingService({ tenantId: req.user.tenantId, supabase: req.supabase || null });
  const result = await service.checkQuota(req.params.type);
  return response.success(res, { allowed: result });
}));

// 2. Coupon Application (Admins Only)
router.post('/coupons/apply', authenticate, requireAdmin(), asyncHandler(async (req, res) => {
  const service = new BillingService({ tenantId: req.user.tenantId, supabase: req.supabase || null });
  const result = await service.applyCoupon(req.body.code);
  return response.success(res, result, 'Coupon successfully applied');
}));

// 3. Lifecycle Management (Super Admin / Admin only)
router.post('/admin/grace', authenticate, requireAdmin(), asyncHandler(async (req, res) => {
  const service = new BillingService({ tenantId: req.user.tenantId, supabase: req.supabase || null });
  await service.grantGracePeriod(req.body.days || 7);
  return response.success(res, null, 'Grace period granted');
}));

router.post('/admin/offboard', authenticate, requireAdmin(), asyncHandler(async (req, res) => {
  const service = new BillingService({ tenantId: req.user.tenantId, supabase: req.supabase || null });
  await service.offboardTenant();
  return response.success(res, null, 'Agency lifecycle terminated');
}));

export default router;
