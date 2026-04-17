import express from 'express';
import { runSubscriptionLifecycle } from './subscription-lifecycle.js';
import { runEngagementDigest, runInvoiceAging, runArchiving, runVendorPaymentAlerts, runHealthScoreCalculator, runVisaAppointmentAlerts } from './cron-tasks.js';
import cronService from './cronService.js';
import { supabaseAdmin } from '../providers/database/supabase.js';

const router = express.Router();

function requireCronSecret(req, res, next) {
  const secret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Daily Maintenance (2:00 AM) ──────────────────────────────
router.post('/daily-maintenance', requireCronSecret, async (req, res, next) => {
  try {
    const result = await cronService.runDailyMaintenance();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ─── Intravos Bot 2-Hourly Cycle ─────────────────────────────────
router.post('/bot-cycle', requireCronSecret, async (req, res, next) => {
  try {
    const result = await cronService.run2HourlyBotCycle();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// ─── Dashboard Cache Refresh (every 10 minutes) ───────────────
router.post('/refresh-dashboard-cache', requireCronSecret, async (req, res, next) => {
  try {
    await cronService.refreshDashboardCache();
    res.json({ ok: true, message: 'Dashboard cache refreshed' });
  } catch (err) {
    next(err);
  }
});

// ─── Subscription Lifecycle ───────────────────────────────────
router.post('/subscription-lifecycle', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runSubscriptionLifecycle(supabaseAdmin);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/engagement-digest', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runEngagementDigest();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/invoice-aging', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runInvoiceAging();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/archiving', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runArchiving();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/vendor-payment-alerts', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runVendorPaymentAlerts();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/health-score-calculator', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runHealthScoreCalculator();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/visa-appointment-alerts', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runVisaAppointmentAlerts();
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
