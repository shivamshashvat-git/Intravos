
import { z } from 'zod';

export const createItinerarySchema = z.object({
  booking_id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.string().optional(),
  is_template: z.boolean().optional()
});

export const updateItinerarySchema = createItinerarySchema.partial();

export const createDaySchema = z.object({
  day_number: z.number().int().min(1),
  title: z.string().optional(),
  description: z.string().optional()
});

export const updateDaySchema = createDaySchema.partial();

export const createItemSchema = z.object({
  item_type: z.enum(['transport', 'hotel', 'activity', 'meal', 'note']),
  title: z.string(),
  description: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  sort_order: z.number().int().optional()
});

export const updateItemSchema = createItemSchema.partial();

export const reorderItemsSchema = z.object({
  item_ids: z.array(z.string().uuid())
});
