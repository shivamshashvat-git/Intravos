import { z } from 'zod';

const agencyRoles = z.enum([
  'agency_admin', 
  'secondary_admin', 
  'staff'
]);

export const userInviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: agencyRoles,
  designation: z.string().optional().nullable()
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  role: agencyRoles.optional(),
  designation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().optional()
});

export const meUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
  phone: z.string().optional().nullable()
});
