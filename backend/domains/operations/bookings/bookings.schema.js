
import { z } from 'zod';

export const createBookingSchema = z.object({
  customer_id: z.string().uuid(),
  quotation_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  customer_name: z.string(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional(),
  destination: z.string().optional(),
  travel_start_date: z.string().optional(),
  travel_end_date: z.string().optional(),
  traveler_count: z.number().int().min(1).optional(),
  total_selling_price: z.number().optional(),
  special_requests: z.string().optional(),
  internal_notes: z.string().optional(),
  status: z.enum(['enquiry', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional()
});

export const updateBookingSchema = z.object({
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional(),
  destination: z.string().optional(),
  travel_start_date: z.string().optional(),
  travel_end_date: z.string().optional(),
  traveler_count: z.number().int().min(1).optional(),
  total_selling_price: z.number().optional(),
  special_requests: z.string().optional(),
  internal_notes: z.string().optional(),
  status: z.enum(['enquiry', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  cancellation_reason: z.string().optional()
});

export const addServiceSchema = z.object({
  service_type: z.enum(['hotel', 'flight', 'activity', 'transfer', 'note', 'meal', 'internal_note', 'insurance', 'lounge', 'sim_card', 'forex']),
  supplier_id: z.string().uuid().optional(),
  title: z.string(),
  confirmation_number: z.string().optional(),
  service_start_date: z.string().optional(),
  service_end_date: z.string().optional(),
  cost_to_agency: z.number().min(0).optional(),
  price_to_client: z.number().min(0).optional()
});

export const updateServiceSchema = addServiceSchema.partial();
