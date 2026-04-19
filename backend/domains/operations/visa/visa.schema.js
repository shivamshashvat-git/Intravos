
import { z } from 'zod';

export const visaTrackingSchema = z.object({
  customer_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  traveler_name: z.string().min(2),
  applicant_name: z.string().optional(),
  destination: z.string().min(2),
  visa_type: z.string().default('tourist'),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
  visa_fee: z.number().min(0).optional(),
  service_charge: z.number().min(0).optional(),
  appointment_date: z.string().optional(),
  submission_date: z.string().optional(),
  expected_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  status: z.enum(['not_started', 'documents_pending', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled']).default('not_started'),
  notes: z.string().optional(),
  rejection_reason: z.string().optional()
});

export const updateVisaTrackingSchema = visaTrackingSchema.partial();

export const visaDocumentSchema = z.object({
  document_type: z.string().min(2),
  file_url: z.string().url(),
  file_name: z.string().optional(),
  storage_bucket: z.string().optional(),
  storage_path: z.string().optional()
});

export const verifyDocumentSchema = z.object({
  verified: z.boolean()
});
