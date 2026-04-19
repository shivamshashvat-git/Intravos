
import { z } from 'zod';

export const groupMemberSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  room_number: z.string().optional(),
  notes: z.string().optional()
});

export const updateGroupMemberSchema = groupMemberSchema.partial();
