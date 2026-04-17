import calendarController from './calendar.controller.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff  } from '../../../core/middleware/rbac.js';
import { asyncHandler  } from '../../../core/middleware/errorHandler.js';

const router = express.Router();

// ── HELPERS ──

function toDateStr(date) {
  return date instanceof Date ? date.toISOString().split('T')[0] : date;
}

// ── UNIFIED CALENDAR ──

// GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
// Aggregates events from: leads (departures/checkins/followups), tasks, visa appointments, customer dates (birthdays/anniversaries)
router.get('/', authenticate, requireStaff(), asyncHandler((req, res, next) => calendarController.get__0(req, res, next)));;

// ── SYNC (regenerate stored calendar_events table) ──

// POST /api/calendar/sync
// Rebuilds the calendar_events table for this tenant from current data.
// Useful for data integrity after bulk imports or migrations.
router.post('/sync', authenticate, asyncHandler((req, res, next) => calendarController.post_sync_1(req, res, next)));;

export default router;
