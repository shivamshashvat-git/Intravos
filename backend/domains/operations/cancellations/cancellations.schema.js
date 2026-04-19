
import { z } from 'zod';

export const cancelBookingSchema = z.object({
  cancellation_reason: z.string().min(5),
  cancellation_charge: z.number().min(0),
  refund_due_to_client: z.number().min(0).optional(),
  supplier_refund_due: z.number().min(0).optional(),
  notes: z.string().optional()
});
