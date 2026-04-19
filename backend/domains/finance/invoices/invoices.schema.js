import { z } from 'zod';

export const invoiceSchema = z.object({
  customer_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  invoice_number: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email().optional().or(z.literal('')).nullable(),
  customer_phone: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
  customer_gstin: z.string().optional().nullable(),
  place_of_supply: z.string().optional().nullable(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled']).default('pending'),
  subtotal: z.number().default(0),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  total_amount: z.number().min(0),
  balance_amount: z.number().default(0),
  notes: z.string().optional().nullable(),
  bank_details: z.string().optional().nullable(),
  items: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    hsn_sac: z.string().optional().nullable(),
    quantity: z.number().default(1),
    rate: z.number().default(0),
    amount: z.number().default(0),
    tax_rate: z.number().default(0),
    tax_amount: z.number().default(0)
  })).optional().default([])
});

export const updateInvoiceSchema = invoiceSchema.partial();
