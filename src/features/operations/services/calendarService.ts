import { apiClient } from '@/core/lib/apiClient';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';

export type CalendarEventType = 'booking' | 'departure' | 'checkout' | 'followup' | 'task_due' | 'visa_appointment';

export interface CalendarEvent {
  id: string;
  event_type: CalendarEventType;
  title: string;
  date: string;            // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD (bookings only)
  status?: string;
  booking_ref?: string;
  pax?: number;
  metadata?: Record<string, any>;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  total: number;
  from: string;
  to: string;
}

/**
 * Fetch all calendar events for a given month.
 * Uses from/to spanning the full calendar grid (including prev/next month overflow days).
 *
 * @param month - ISO month string e.g. "2026-04"
 */
export const fetchCalendarEvents = async (month: string): Promise<CalendarEvent[]> => {
  // Parse the month and compute start/end for the full grid (+/- 1 week buffer)
  const [year, mon] = month.split('-').map(Number);
  const pivot = new Date(year, mon - 1, 1);
  const from = format(addMonths(startOfMonth(pivot), -0), 'yyyy-MM-dd');
  const to = format(endOfMonth(pivot), 'yyyy-MM-dd');

  const params = new URLSearchParams({ from, to });
  const res = await apiClient(`/api/operations/calendar?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to fetch calendar events');
  }

  const json = await res.json();
  return (json.data?.events || json.data || []) as CalendarEvent[];
};

/**
 * Fetch events for a two-month window (useful for week view near month boundaries).
 */
export const fetchCalendarRange = async (from: string, to: string): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({ from, to });
  const res = await apiClient(`/api/operations/calendar?${params.toString()}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to fetch calendar events');
  }

  const json = await res.json();
  return (json.data?.events || json.data || []) as CalendarEvent[];
};
