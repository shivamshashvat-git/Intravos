import { z } from 'zod';

export const quotationSchema = z.object({
  customer_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email().optional().or(z.literal('')).nullable(),
  customer_phone: z.string().optional().nullable(),
  title: z.string().min(1, 'Quotation title is required'),
  destination: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
  total_amount: z.number().default(0),
  currency: z.string().default('INR'),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().default(1),
    rate: z.number().default(0),
    amount: z.number().default(0)
  })).optional().default([])
});

export const updateQuotationSchema = quotationSchema.partial();
