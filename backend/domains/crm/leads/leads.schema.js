import { z } from 'zod';

export const leadStatusEnum = z.enum(['new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold']);
export const leadSourceEnum = z.enum(['whatsapp', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram', 'manual']);
export const leadPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

export const leadCreateSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").optional(),
  customer_phone: z.string().min(1, "Phone is required").optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_id: z.string().uuid().optional(),
  destination: z.string().optional(),
  budget: z.number().optional(),
  expected_profit: z.number().optional(),
  travel_start_date: z.string().optional(),
  travel_duration: z.number().int().optional(),
  guests: z.number().int().positive().optional(),
  rooms: z.number().int().positive().optional(),
  source: leadSourceEnum.optional().default('manual'),
  priority: leadPriorityEnum.optional().default('normal'),
  status: leadStatusEnum.optional().default('new'),
  assigned_to: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(data => data.customer_id || (data.customer_name && data.customer_phone), {
  message: "Either customer_id or (customer_name + customer_phone) must be provided."
});

export const leadUpdateSchema = z.object({
  customer_name: z.string().min(1).optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  destination: z.string().optional(),
  budget: z.number().optional(),
  expected_profit: z.number().optional(),
  status: leadStatusEnum.optional(),
  priority: leadPriorityEnum.optional(),
  assigned_to: z.string().uuid().optional(),
  travel_start_date: z.string().optional(),
  travel_duration: z.number().int().optional(),
  guests: z.number().int().positive().optional(),
  rooms: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  is_active: z.boolean().optional(),
});

export const leadNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  is_pinned: z.boolean().optional().default(false),
});

export const leadFollowupSchema = z.object({
  followup_date: z.string().min(1, "Follow-up date/time is required"),
  note: z.string().optional(),
  priority: leadPriorityEnum.optional().default('normal'),
});

export const leadAssignSchema = z.object({
  assigned_to: z.string().uuid(),
  silent: z.boolean().optional().default(false),
});
