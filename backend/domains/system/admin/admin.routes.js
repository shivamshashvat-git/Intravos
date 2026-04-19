import adminController from './admin.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireSuperAdmin, requireWriteAccess  } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { logPlatformChange  } from '../announcements/changelog.js';
import { refreshClientHealth  } from '../../crm/analytics/clientHealth.js';

const router = express.Router();

function requireSuperAdminActor(req, res, next) {
  const actor = req.impersonator || req.user;
  const platformRoles = ['super_admin', 'platform_manager', 'ivobot'];
  if (!actor || !platformRoles.includes(actor.role)) {
    return res.status(403).json({ error: 'Platform tier access required' });
  }
  next();
}

// All admin routes require authentication + super_admin role
router.use(authenticate, requireSuperAdminActor);

// ── OVERVIEW ──

// GET /api/admin/tenants/overview
// Returns a high-level count breakdown of all tenants by subscription status.
router.get('/tenants/overview', asyncHandler((req, res, next) => adminController.get_tenants_overview_0(req, res, next)));;

// ── REVENUE ──
router.get('/revenue-dashboard', asyncHandler((req, res, next) => adminController.get_revenue_dashboard_24(req, res, next)));;

// ── PLATFORM SETTINGS ──
router.get('/platform-settings', asyncHandler((req, res, next) => adminController.get_platform_settings_25(req, res, next)));;
router.patch('/platform-settings', requireWriteAccess, asyncHandler((req, res, next) => adminController.patch_platform_settings_26(req, res, next)));;

// ── EXPIRING SOON ──

// GET /api/admin/tenants/expiring
// Returns tenants whose subscription_end_date falls within the next 7 days.
// Used to proactively reach out before renewal lapses.
router.get('/tenants/expiring', asyncHandler((req, res, next) => adminController.get_tenants_expiring_1(req, res, next)));;

// ── AT RISK ──

// GET /api/admin/tenants/at-risk
// Returns tenants currently in grace or limited — actively losing access.
router.get('/tenants/at-risk', asyncHandler((req, res, next) => adminController.get_tenants_at_risk_2(req, res, next)));;

router.get('/changelog', asyncHandler((req, res, next) => adminController.get_changelog_3(req, res, next)));;

router.get('/announcements', asyncHandler((req, res, next) => adminController.get_announcements_4(req, res, next)));;

router.post('/announcements', requireWriteAccess, asyncHandler((req, res, next) => adminController.post_announcements_5(req, res, next)));;

router.patch('/announcements/:id', requireWriteAccess, asyncHandler((req, res, next) => adminController.patch_announcements__id_6(req, res, next)));;

router.delete('/announcements/:id', requireWriteAccess, asyncHandler((req, res, next) => adminController.delete_announcements__id_7(req, res, next)));;

router.get('/platform-payments', asyncHandler((req, res, next) => adminController.get_platform_payments_8(req, res, next)));;

router.get('/client-health', asyncHandler((req, res, next) => adminController.get_client_health_9(req, res, next)));;

router.get('/upgrade-requests', asyncHandler((req, res, next) => adminController.get_upgrade_requests_10(req, res, next)));;

router.get('/support-tickets', asyncHandler((req, res, next) => adminController.get_support_tickets_33(req, res, next)));;

router.get('/impersonation/sessions', asyncHandler((req, res, next) => adminController.get_impersonation_sessions_11(req, res, next)));;

router.post('/impersonation/start', asyncHandler((req, res, next) => adminController.post_impersonation_start_12(req, res, next)));;

router.post('/impersonation/end', asyncHandler((req, res, next) => adminController.post_impersonation_end_13(req, res, next)));;

router.get('/network/members', asyncHandler((req, res, next) => adminController.get_network_members_14(req, res, next)));;

router.patch('/network/members/:id', asyncHandler((req, res, next) => adminController.patch_network_members__id_15(req, res, next)));;

router.get('/network/reports', asyncHandler((req, res, next) => adminController.get_network_reports_16(req, res, next)));;

router.patch('/network/reports/:id', asyncHandler((req, res, next) => adminController.patch_network_reports__id_17(req, res, next)));;

router.get('/coupons', asyncHandler((req, res, next) => adminController.get_coupons_18(req, res, next)));;

router.post('/coupons', asyncHandler((req, res, next) => adminController.post_coupons_19(req, res, next)));;

router.patch('/coupons/:id', asyncHandler((req, res, next) => adminController.patch_coupons__id_20(req, res, next)));;

router.get('/coupons/:id/usage', asyncHandler((req, res, next) => adminController.get_coupons__id_usage_21(req, res, next)));;

router.get('/sales-requests', asyncHandler((req, res, next) => adminController.get_sales_requests_22(req, res, next)));;

router.patch('/sales-requests/:id', asyncHandler((req, res, next) => adminController.patch_sales_requests__id_23(req, res, next)));;

// ── PROSPECTS (CRM) ──
router.get('/prospects', asyncHandler((req, res, next) => adminController.get_prospects_27(req, res, next)));;
router.post('/prospects', asyncHandler((req, res, next) => adminController.post_prospect_28(req, res, next)));;
router.patch('/prospects/:id', asyncHandler((req, res, next) => adminController.patch_prospect_29(req, res, next)));;

// ── PLATFORM BILLING ──
router.get('/platform-invoices', asyncHandler((req, res, next) => adminController.get_platform_invoices_30(req, res, next)));;
router.post('/platform-invoices', asyncHandler((req, res, next) => adminController.post_generate_platform_invoice_31(req, res, next)));;
router.post('/platform-invoices/record-payment', asyncHandler((req, res, next) => adminController.post_platform_invoice_payment_32(req, res, next)));;

// ── GLOBAL STAFF VISIBILITY ──
router.get('/staff', asyncHandler((req, res, next) => adminController.get_all_staff(req, res, next)));

// ── SAAS REFERRALS (Super Admin) ──
router.get('/referrals', asyncHandler((req, res, next) => adminController.get_referrals_34(req, res, next)));
router.post('/referrals/:id/fulfill', asyncHandler((req, res, next) => adminController.post_fulfill_referral_35(req, res, next)));
router.patch('/referrals/:id', asyncHandler((req, res, next) => adminController.patch_referral_36(req, res, next)));

// ── TENANT LIFECYCLE CONTROLS ──
router.post('/tenants/:id/grace', asyncHandler((req, res, next) => adminController.post_grant_grace_period(req, res, next)));
router.delete('/tenants/:id', requireWriteAccess, asyncHandler((req, res, next) => adminController.delete_offboard_tenant(req, res, next)));

export default router;
