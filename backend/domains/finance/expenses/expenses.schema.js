import { z } from 'zod';

export const expenseSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  booking_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'upi', 'other']).default('cash'),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']).default('pending'),
  receipt_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([])
});

export const updateExpenseSchema = expenseSchema.partial();
