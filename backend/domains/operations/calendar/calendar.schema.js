
import { z } from 'zod';

export const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_type: z.enum(['booking', 'departure', 'checkout', 'followup', 'task_due', 'visa_appointment', 'custom']).default('custom'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD required').optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  color_code: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  entity_type: z.string().optional().nullable(),
  entity_id: z.string().uuid().optional().nullable()
});

export const updateCalendarEventSchema = calendarEventSchema.partial();

export const calendarFilterSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'From date (YYYY-MM-DD) required'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'To date (YYYY-MM-DD) required'),
  type: z.string().optional()
});
