import customersController from './customers.controller.js';
import { z } from 'zod';
import { validate } from '../../../core/middleware/validate.js';
import express from 'express';
import { supabaseAdmin  } from '../../../providers/database/supabase.js';
import { authenticate  } from '../../../core/middleware/auth.js';
import { requireStaff, requireAdmin, requireWriteAccess } from '../../../core/middleware/rbac.js';
import { requireFeature } from '../../../core/middleware/featureFlag.js';

import { asyncHandler  } from '../../../core/middleware/errorHandler.js';
import { softDeleteDirect  } from '../../../core/utils/softDelete.js';

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

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function overlapScore(a, b) {
  const aParts = new Set(normalizeName(a).split(' ').filter(Boolean));
  const bParts = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (!aParts.size || !bParts.size) return 0;

  let matches = 0;
  for (const item of aParts) {
    if (bParts.has(item)) matches += 1;
  }

  return matches / Math.max(aParts.size, bParts.size);
}

function buildMergePreview(keepCustomer, mergeCustomer) {
  const keepPhone = normalizePhone(keepCustomer.phone);
  const mergePhone = normalizePhone(mergeCustomer.phone);
  const keepAlt = normalizePhone(keepCustomer.alt_phone);
  const mergeAlt = normalizePhone(mergeCustomer.alt_phone);
  const keepEmail = normalizeEmail(keepCustomer.email);
  const mergeEmail = normalizeEmail(mergeCustomer.email);
  const nameScore = overlapScore(keepCustomer.name, mergeCustomer.name);

  let score = 0;
  const reasons = [];

  const samePrimaryPhone = keepPhone && mergePhone && keepPhone === mergePhone;
  const phoneCrossMatch = keepPhone && mergeAlt && keepPhone === mergeAlt || keepAlt && mergePhone && keepAlt === mergePhone;
  const sameEmail = keepEmail && mergeEmail && keepEmail === mergeEmail;
  const exactName = normalizeName(keepCustomer.name) && normalizeName(keepCustomer.name) === normalizeName(mergeCustomer.name);

  if (samePrimaryPhone) {
    score += 90;
    reasons.push('Same primary phone number');
  }
  if (!samePrimaryPhone && phoneCrossMatch) {
    score += 75;
    reasons.push('Primary and alternate phone numbers match');
  }
  if (sameEmail) {
    score += 70;
    reasons.push('Same email address');
  }
  if (exactName) {
    score += 15;
    reasons.push('Exact customer name match');
  } else if (nameScore >= 0.8) {
    score += 10;
    reasons.push('Strong customer name match');
  }

  const highConfidence = samePrimaryPhone || phoneCrossMatch || (sameEmail && nameScore >= 0.8) || score >= 90;
  const ambiguous = !highConfidence && score >= 55;
  const confidenceLabel = highConfidence ? 'high' : ambiguous ? 'ambiguous' : 'low';
  const confirmationPhrase = `MERGE ${mergeCustomer.name} INTO ${keepCustomer.name}`;

  return {
    keep_customer: keepCustomer,
    merge_customer: mergeCustomer,
    confidence_score: score,
    confidence_label: confidenceLabel,
    high_confidence: highConfidence,
    requires_manual_confirmation: ambiguous,
    reasons,
    action_label: highConfidence ? 'Merge customer records' : 'Manual merge confirmation required',
    confirmation_phrase: ambiguous ? confirmationPhrase : null };
}

async function fetchMergeCustomers(tenantId, keepId, mergeId) {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .in('id', [keepId, mergeId]);

  if (error) throw error;

  const keepCustomer = (data || []).find((item) => item.id === keepId);
  const mergeCustomer = (data || []).find((item) => item.id === mergeId);
  return { keepCustomer, mergeCustomer };
}

function mergeCustomerPayload(keepCustomer, mergeCustomer) {
  const mergedImportantDates = uniqueBy(
    [...(keepCustomer.important_dates || []), ...(mergeCustomer.important_dates || [])],
    (item) => `${item.type || ''}:${item.date || ''}`
  );
  const mergedTags = [...new Set([...(keepCustomer.tags || []), ...(mergeCustomer.tags || [])])];
  const mergedNotes = [keepCustomer.notes, mergeCustomer.notes].filter(Boolean).join('\n\n').trim() || null;

  const merged = {
    name: keepCustomer.name || mergeCustomer.name,
    phone: keepCustomer.phone || mergeCustomer.phone,
    phone_is_whatsapp: keepCustomer.phone_is_whatsapp !== undefined ? keepCustomer.phone_is_whatsapp : mergeCustomer.phone_is_whatsapp,
    alt_phone: keepCustomer.alt_phone || (mergeCustomer.phone !== keepCustomer.phone ? mergeCustomer.phone : mergeCustomer.alt_phone) || null,
    alt_phone_is_whatsapp: keepCustomer.alt_phone ? keepCustomer.alt_phone_is_whatsapp : (mergeCustomer.phone !== keepCustomer.phone ? mergeCustomer.phone_is_whatsapp : mergeCustomer.alt_phone_is_whatsapp),
    email: keepCustomer.email || mergeCustomer.email || null,
    address: keepCustomer.address || mergeCustomer.address || null,
    important_dates: mergedImportantDates,
    tags: mergedTags,
    preferred_channel: keepCustomer.preferred_channel || mergeCustomer.preferred_channel || null,
    preferred_time: keepCustomer.preferred_time || mergeCustomer.preferred_time || null,
    preferred_language: keepCustomer.preferred_language || mergeCustomer.preferred_language || null,
    do_not_disturb: keepCustomer.do_not_disturb || mergeCustomer.do_not_disturb || false,
    referral_source: keepCustomer.referral_source || mergeCustomer.referral_source || null,
    passport_details: keepCustomer.passport_details || mergeCustomer.passport_details || null,
    preferences: { ...(mergeCustomer.preferences || {}), ...(keepCustomer.preferences || {}) },
    notes: mergedNotes,
    lifetime_value: (keepCustomer.lifetime_value || 0) + (mergeCustomer.lifetime_value || 0),
    total_bookings: (keepCustomer.total_bookings || 0) + (mergeCustomer.total_bookings || 0),
    last_booking_date: [keepCustomer.last_booking_date, mergeCustomer.last_booking_date].filter(Boolean).sort().reverse()[0] || null };

  return merged;
}

async function applyCustomerMerge({ tenantId, keepCustomer, mergeCustomer, mergedBy, preview, reason }) {
  const mergedPayload = mergeCustomerPayload(keepCustomer, mergeCustomer);
  const movedCounts = {};

  await supabaseAdmin
    .from('customers')
    .update(mergedPayload)
    .eq('id', keepCustomer.id)
    .eq('tenant_id', tenantId);

  const customerReferenceTables = [
    'associated_travelers',
    'customer_documents',
    'leads',
    'quotations',
    'invoices',
    'itineraries',
    'visa_tracking',
    'notifications',
    'engagement_log',
    'calendar_events',
  ];

  for (const table of customerReferenceTables) {
    const { data: records, error } = await supabaseAdmin
      .from(table)
      .select('id', { count: 'exact' })
      .eq('customer_id', mergeCustomer.id);

    if (error) throw error;
    const moved = records ? records.length : 0;
    movedCounts[table] = moved;

    if (moved > 0) {
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ customer_id: keepCustomer.id })
        .eq('customer_id', mergeCustomer.id);

      if (updateError) throw updateError;
    }
  }

  const { data: logRecord, error: logError } = await supabaseAdmin
    .from('customer_merge_logs')
    .insert({
      tenant_id: tenantId,
      kept_customer_id: keepCustomer.id,
      merged_customer_id: mergeCustomer.id,
      merged_customer_snapshot: mergeCustomer,
      merged_by: mergedBy,
      confidence_label: preview.confidence_label,
      confidence_score: preview.confidence_score,
      match_reasons: preview.reasons,
      action_label: `Merged ${mergeCustomer.name} into ${keepCustomer.name}`,
      summary: {
        reason: reason || null,
        moved_counts: movedCounts,
        kept_customer_name: keepCustomer.name,
        merged_customer_name: mergeCustomer.name } })
    .select()
    .single();

  if (logError) throw logError;

  await supabaseAdmin
    .from('customers')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: mergedBy })
    .eq('id', mergeCustomer.id)
    .eq('tenant_id', tenantId);

  return { mergedPayload, movedCounts, logRecord };
}

router.post('/merge/preview', authenticate, requireAdmin(), requireFeature('customers'), asyncHandler((req, res) => customersController.post_merge_preview_0(req, res)));;

router.post('/merge', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.post_merge_1(req, res)));;

router.get('/merge/logs', authenticate, requireAdmin(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_merge_logs_2(req, res)));;

router.get('/', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get__3(req, res)));;

router.get('/:id', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_4(req, res)));;

router.post('/', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), validate(customerCreateSchema), asyncHandler((req, res) => customersController.post__5(req, res)));;

router.patch('/:id', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.patch_id_6(req, res)));

router.post('/:id/privacy/revoke', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res, next) => customersController.post_id_privacy_revoke(req, res, next)));

router.post('/:id/travelers', authenticate, requireStaff(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.post_id_travelers_7(req, res)));

router.get('/:id/travelers', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_travelers_8(req, res)));;

router.get('/:id/timeline', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_timeline_10(req, res)));;

router.get('/:id/bookings', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_bookings_11(req, res)));;

router.get('/:id/quotations', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_quotations_12(req, res)));;

router.get('/:id/invoices', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_invoices_13(req, res)));;

router.get('/:id/visas', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_visas_14(req, res)));;

router.get('/:id/documents', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_documents_15(req, res)));;

router.get('/:id/travel-history', authenticate, requireStaff(), requireFeature('customers'), asyncHandler((req, res) => customersController.get_id_travel_history_11(req, res)));;

router.delete('/:id', authenticate, requireAdmin(), requireWriteAccess, requireFeature('customers'), asyncHandler((req, res) => customersController.delete_id_9(req, res)));;

export default router;
