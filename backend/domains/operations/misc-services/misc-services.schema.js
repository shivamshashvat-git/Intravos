
import { z } from 'zod';

export const miscServiceSchema = z.object({
  booking_id: z.string().uuid(),
  service_type: z.string(),
  title: z.string(),
  description: z.string().optional(),
  cost_price: z.number().min(0).optional(),
  selling_price: z.number().min(0),
  status: z.string().optional(),
  notes: z.string().optional()
});

export const updateMiscServiceSchema = miscServiceSchema.partial();
