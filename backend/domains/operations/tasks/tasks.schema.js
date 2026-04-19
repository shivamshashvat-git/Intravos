
import { z } from 'zod';

export const taskSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  entity_type: z.enum(['lead', 'booking', 'customer', 'visa']).nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  due_date: z.string().nullable().optional(), // YYYY-MM-DD
  due_time: z.string().nullable().optional(), // HH:mm
  reminder_at: z.string().nullable().optional(),
  recurrence_rule: z.string().nullable().optional() // RRULE string
});

export const updateTaskSchema = taskSchema.partial();

export const taskFiltersSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().optional(), // user_id or 'mine'
  entity_type: z.enum(['lead', 'booking', 'customer', 'visa']).optional(),
  entity_id: z.string().uuid().optional(),
  search: z.string().optional()
});
