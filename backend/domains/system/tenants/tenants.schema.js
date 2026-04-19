import { z } from 'zod';

export const tenantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  agency_address: z.string().optional().nullable(),
  agency_phone: z.string().optional().nullable(),
  agency_email: z.string().email().optional().or(z.literal('')).nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  agency_website: z.string().url().optional().or(z.literal('')).nullable(),
  primary_color: z.string().optional().nullable(),
  secondary_color: z.string().optional().nullable(),
  invoice_prefix: z.string().optional().nullable(),
  quote_prefix: z.string().optional().nullable(),
  quote_validity: z.number().optional().nullable(),
  quote_terms: z.string().optional().nullable(),
  quote_inclusions: z.string().optional().nullable(),
  quote_exclusions: z.string().optional().nullable(),
  invoice_bank_text: z.string().optional().nullable()
});

export const platformSettingsSchema = z.object({
  default_currency: z.string().optional(),
  date_format: z.string().optional(),
  invoice_prefix: z.string().optional(),
  quotation_prefix: z.string().optional(),
  default_payment_terms: z.string().optional().nullable(),
  email_footer_text: z.string().optional().nullable(),
  auto_followup_days: z.number().optional()
});

export const bankAccountSchema = z.object({
  account_name: z.string().min(1, 'Account name is required'),
  bank_name: z.string().min(1, 'Bank name is required'),
  acc_type: z.enum(['current', 'savings', 'upi']),
  running_balance: z.number().optional().default(0)
});
