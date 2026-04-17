import tenantsController from './tenants.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin, requireSuperAdmin  } from '../../../core/middleware/rbac.js';
import { requireSudo } from '../../../core/middleware/sudo.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { logPlatformChange  } from '../announcements/changelog.js';
import { refreshClientHealth  } from '../../crm/analytics/clientHealth.js';

const router = express.Router();

// Current tenant settings (agency admin)
router.get('/current', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.get_current_0(req, res, next)));;

router.patch('/current', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.patch_current_1(req, res, next)));;

router.post('/current/upgrade-request', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.post_current_upgrade_request_2(req, res, next)));;

router.post('/current/sales-request', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.post_current_sales_request_3(req, res, next)));;

router.get('/current/sales-requests', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.get_current_sales_requests_4(req, res, next)));;

router.post('/current/apply-coupon', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.post_current_apply_coupon_4b(req, res, next)));;

// Super-admin: list all tenants
router.get('/', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.get__5(req, res, next)));;

router.get('/:id', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.get_id_6(req, res, next)));;

router.patch('/:id', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.patch_id_7(req, res, next)));;

router.patch('/:id/features', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.patch_id_features_8(req, res, next)));;

router.post('/:id/trial/start', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.post_id_trial_start_9(req, res, next)));;

router.post('/:id/trial/extend', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.post_id_trial_extend_10(req, res, next)));;

router.post('/:id/activate-subscription', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.post_id_activate_subscription_11(req, res, next)));;

router.get('/:id/changelog', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.get_id_changelog_12(req, res, next)));;

router.get('/:id/platform-payments', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.get_id_platform_payments_13(req, res, next)));;

router.post('/:id/platform-payments', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.post_id_platform_payments_14(req, res, next)));;

router.get('/:id/client-health', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.get_id_client_health_15(req, res, next)));;

router.post('/:id/login-link', authenticate, requireSuperAdmin(), asyncHandler((req, res, next) => tenantsController.post_id_login_link_16(req, res, next)));

// Agency Admin: Financial Audit Log (own tenant only)
router.get('/current/audit-log', authenticate, requireAdmin(), asyncHandler((req, res, next) => tenantsController.get_current_audit_log_17(req, res, next)));

// Dashboard Stats Cache (instant load for all staff)
router.get('/current/dashboard-stats', authenticate, asyncHandler((req, res, next) => tenantsController.get_current_dashboard_stats_18(req, res, next)));

export default router;
