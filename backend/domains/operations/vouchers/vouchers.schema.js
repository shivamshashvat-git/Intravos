
import { z } from 'zod';

export const createVoucherSchema = z.object({
  booking_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  voucher_number: z.string(),
  supplier_id: z.string().uuid().optional(),
  service_title: z.string(),
  service_description: z.string().optional(),
  confirmation_number: z.string().optional(),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  status: z.enum(['draft', 'issued', 'used', 'cancelled']).optional(),
  notes: z.string().optional()
});

export const updateVoucherSchema = createVoucherSchema.partial();
