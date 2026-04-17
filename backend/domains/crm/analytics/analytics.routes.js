import analyticsController from './analytics.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireAdmin } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── HELPERS ──

// Returns the date the tenant's usage clock started.
// Prefer subscription_start_date (when they went active) over created_at.
function getUsageStartDate(tenant) {
  return new Date(tenant.subscription_start_date || tenant.created_at);
}

function daysSince(date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

const UNLOCK_DAYS = 90;

function toAmount(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKey(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function avg(items, field) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + toAmount(item[field]), 0) / items.length;
}

// ── SUMMARY ──

// GET /api/analytics/summary
// Returns core booking and revenue metrics.
// Locked for the first 90 days of usage — returns { locked: true } until then.
router.get('/summary', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_summary_0(req, res, next)));;

router.get('/pnl/monthly', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_pnl_monthly_1(req, res, next)));;

router.get('/booking-margins', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_booking_margins_2(req, res, next)));;

router.get('/vendor-reconciliation', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_vendor_reconciliation_3(req, res, next)));;

router.get('/feedback-summary', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_feedback_summary_4(req, res, next)));;

router.get('/insurance-alerts', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_insurance_alerts_5(req, res, next)));;

router.get('/dashboard', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_dashboard_6(req, res, next)));;

router.get('/revenue', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_revenue_7(req, res, next)));;

router.get('/pipeline', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_pipeline_8(req, res, next)));;

router.get('/pnl', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_pnl_9(req, res, next)));;

router.get('/gst-summary', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_gst_summary_10(req, res, next)));;

router.get('/customers', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_customers_11(req, res, next)));;

router.get('/staff', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_staff_12(req, res, next)));;

router.get('/export', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_export_13(req, res, next)));;

router.get('/export/csv', authenticate, requireAdmin(), requireFeature('analytics'), asyncHandler((req, res, next) => analyticsController.get_export_csv_15(req, res, next)));;

export default router;
