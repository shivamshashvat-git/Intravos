import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  alt_phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  customer_type: z.enum(['individual', 'corporate']).default('individual'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  wedding_anniversary: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  preferred_destinations: z.string().optional().nullable(),
  preferred_airlines: z.string().optional().nullable(),
  preferred_hotel_class: z.string().optional().nullable(),
  dietary_preferences: z.string().optional().nullable(),
  special_needs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  important_dates: z.array(z.object({
    label: z.string(),
    date: z.string(),
    type: z.enum(['birthday', 'anniversary', 'other'])
  })).optional().nullable(),
  passport_details: z.object({
    passport_number: z.string().optional().nullable(),
    passport_expiry: z.string().optional().nullable(),
    place_of_issue: z.string().optional().nullable(),
    issue_date: z.string().optional().nullable()
  }).optional().nullable(),
  preferences: z.record(z.any()).optional().nullable()
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const associatedTravelerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  passport_number: z.string().optional().nullable(),
  passport_expiry: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  notes: z.string().optional().nullable()
});

export const messageTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  content: z.string().min(1, 'Template content is required'),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const feedbackRequestSchema = z.object({
  booking_id: z.string().uuid('Valid Booking ID is required'),
  customer_id: z.string().uuid('Valid Customer ID is required'),
  feedback_type: z.enum(['post_trip', 'general']).default('post_trip')
});

export const feedbackSubmitSchema = z.object({
  rating: z.number().min(1).max(5),
  comments: z.string().optional().nullable(),
  details: z.record(z.any()).optional().nullable()
});

export const referralSchema = z.object({
  referrer_id: z.string().uuid().optional().nullable(),
  referred_customer_id: z.string().uuid().optional().nullable(),
  referred_lead_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'converted', 'rewarded']).default('pending'),
  commission_amount: z.number().default(0),
  notes: z.string().optional().nullable()
});
