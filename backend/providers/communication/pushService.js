import webpush from 'web-push';
import { supabaseAdmin } from '../database/supabase.js';

// ─── VAPID Configuration ──────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@intravos.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ─── Push Payload Builder ─────────────────────────────────────
/**
 * Builds a standardized push notification payload.
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} [options] - Additional options
 * @param {string} [options.icon] - Icon URL
 * @param {string} [options.badge] - Badge URL
 * @param {string} [options.tag] - Notification tag (for grouping/replacing)
 * @param {string} [options.url] - Click-through URL
 * @param {object} [options.data] - Arbitrary data payload
 * @returns {string} JSON string for web-push
 */
function buildPayload(title, body, options = {}) {
  return JSON.stringify({
    title,
    body,
    icon: options.icon || '/icons/icon-192x192.png',
    badge: options.badge || '/icons/badge-72x72.png',
    tag: options.tag || undefined,
    data: {
      url: options.url || '/',
      ...options.data,
    },
    // Auto-dismiss after 30 seconds
    requireInteraction: false,
    timestamp: Date.now(),
  });
}

// ─── Core Send Function ───────────────────────────────────────
/**
 * Sends a push notification to a specific user across all their devices.
 * Automatically cleans up expired/invalid subscriptions.
 *
 * @param {string} tenantId - Tenant UUID
 * @param {string} userId - Target user UUID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} [options] - Payload options (icon, badge, tag, url, data)
 * @returns {Promise<{sent: number, failed: number, cleaned: number}>}
 */
async function sendPushToUser(tenantId, userId, title, body, options = {}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: 0, cleaned: 0, reason: 'VAPID keys not configured' };
  }

  // Fetch all subscriptions for this user
  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error || !subscriptions?.length) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const payload = buildPayload(title, body, options);
  const expiredIds = [];
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        sent++;
      } catch (err) {
        failed++;
        // 410 Gone or 404 means subscription is no longer valid
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredIds.push(sub.id);
        }
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }

  return { sent, failed, cleaned: expiredIds.length };
}

// ─── Broadcast to All Users in a Tenant ───────────────────────
/**
 * Sends a push notification to ALL users in a tenant.
 * Useful for tenant-wide announcements.
 *
 * @param {string} tenantId - Tenant UUID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} [options] - Payload options
 * @returns {Promise<{total_sent: number, total_failed: number, total_cleaned: number}>}
 */
async function broadcastPushToTenant(tenantId, title, body, options = {}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { total_sent: 0, total_failed: 0, total_cleaned: 0, reason: 'VAPID keys not configured' };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, user_id, subscription')
    .eq('tenant_id', tenantId);

  if (error || !subscriptions?.length) {
    return { total_sent: 0, total_failed: 0, total_cleaned: 0 };
  }

  const payload = buildPayload(title, body, options);
  const expiredIds = [];
  let totalSent = 0;
  let totalFailed = 0;

  // Enterprise batching: process in chunks of 50 with delay to prevent memory timeouts
  const BATCH_SIZE = 50;
  const BATCH_DELAY_MS = 100;
  const MAX_RETRIES = 2;

  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (sub) => {
        let retries = 0;
        while (retries <= MAX_RETRIES) {
          try {
            await webpush.sendNotification(sub.subscription, payload);
            totalSent++;
            return;
          } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              expiredIds.push(sub.id);
              totalFailed++;
              return;
            }
            // Retry on transient errors (429 rate limit, 503 service unavailable)
            if ((err.statusCode === 429 || err.statusCode === 503) && retries < MAX_RETRIES) {
              retries++;
              await new Promise(r => setTimeout(r, BATCH_DELAY_MS * Math.pow(2, retries)));
              continue;
            }
            totalFailed++;
            return;
          }
        }
      })
    );

    // Delay between batches
    if (i + BATCH_SIZE < subscriptions.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds);
  }

  return { total_sent: totalSent, total_failed: totalFailed, total_cleaned: expiredIds.length };
}


// ─── Event-Specific Push Helpers ──────────────────────────────
// These are the "trigger" functions called from controllers.

/**
 * Push: New lead assigned to a staff member.
 */
async function pushLeadAssigned(tenantId, assignedToUserId, leadData) {
  return sendPushToUser(tenantId, assignedToUserId, '📋 New Lead Assigned', `${leadData.customer_name} — ${leadData.destination || 'No destination'}`, {
    tag: `lead-assigned-${leadData.id}`,
    url: `/leads/${leadData.id}`,
    data: { type: 'lead_assigned', lead_id: leadData.id },
  });
}

/**
 * Push: Payment received on a lead.
 */
async function pushPaymentReceived(tenantId, userId, paymentData) {
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(paymentData.amount);
  return sendPushToUser(tenantId, userId, '💰 Payment Received', `${amount} received${paymentData.customer_name ? ` from ${paymentData.customer_name}` : ''}`, {
    tag: `payment-${paymentData.id}`,
    url: paymentData.lead_id ? `/leads/${paymentData.lead_id}` : '/payments',
    data: { type: 'payment_received', payment_id: paymentData.id },
  });
}

/**
 * Push: Task assigned or due soon.
 */
async function pushTaskReminder(tenantId, userId, taskData) {
  return sendPushToUser(tenantId, userId, '✅ Task Reminder', taskData.title, {
    tag: `task-${taskData.id}`,
    url: taskData.lead_id ? `/leads/${taskData.lead_id}` : '/tasks',
    data: { type: 'task_reminder', task_id: taskData.id },
  });
}

/**
 * Push: Follow-up due today.
 */
async function pushFollowupDue(tenantId, userId, followupData) {
  return sendPushToUser(tenantId, userId, '📞 Follow-up Due', `${followupData.customer_name} — ${followupData.note || 'Scheduled follow-up'}`, {
    tag: `followup-${followupData.id}`,
    url: followupData.lead_id ? `/leads/${followupData.lead_id}` : '/followups',
    data: { type: 'followup_due', followup_id: followupData.id },
  });
}

/**
 * Push: Booking status changed.
 */
async function pushBookingStatusChanged(tenantId, userId, bookingData) {
  return sendPushToUser(tenantId, userId, '🏨 Booking Updated', `${bookingData.booking_ref} — Status: ${bookingData.status}`, {
    tag: `booking-${bookingData.id}`,
    url: `/bookings/${bookingData.id}`,
    data: { type: 'booking_status', booking_id: bookingData.id },
  });
}

// ─── Get VAPID Public Key (for frontend registration) ─────────
function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export {
  sendPushToUser,
  broadcastPushToTenant,
  pushLeadAssigned,
  pushPaymentReceived,
  pushTaskReminder,
  pushFollowupDue,
  pushBookingStatusChanged,
  getVapidPublicKey,
};
