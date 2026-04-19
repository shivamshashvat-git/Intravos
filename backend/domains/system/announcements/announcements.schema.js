import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  target_audience: z.enum(['all', 'staff', 'admin']).default('all'),
  is_active: z.boolean().default(true),
  expires_at: z.string().optional().nullable()
});

export const updateAnnouncementSchema = announcementSchema.partial();
