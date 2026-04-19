import { z } from 'zod';

export const dashboardFiltersSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).optional().default('30d')
});

export const dashboardStatsSchema = z.object({
  leads_summary: z.object({
    total: z.number(),
    new_this_month: z.number(),
    contacted: z.number(),
    qualified: z.number(),
    converted: z.number(),
    lost: z.number(),
    conversion_rate: z.number()
  }),
  customers_summary: z.object({
    total: z.number(),
    active: z.number(),
    new_this_month: z.number(),
    avg_health_score: z.number(),
    birthdays_this_week: z.number(),
    dormant_count: z.number()
  }),
  bookings_summary: z.object({
    total: z.number(),
    confirmed: z.number(),
    in_progress: z.number(),
    completed_this_month: z.number(),
    upcoming_departures_7d: z.number(),
    total_revenue_mtd: z.number()
  }),
  finance_summary: z.object({
    total_invoiced_mtd: z.number(),
    total_collected_mtd: z.number(),
    outstanding_balance: z.number(),
    total_expenses_mtd: z.number(),
    net_pnl_mtd: z.number(),
    overdue_invoices_count: z.number()
  }),
  tasks_summary: z.object({
    total_open: z.number(),
    overdue: z.number(),
    due_today: z.number(),
    completed_today: z.number(),
    completion_rate_7d: z.number()
  }),
  visa_summary: z.object({
    total_active: z.number(),
    approved_this_month: z.number(),
    pending_count: z.number(),
    rejection_rate: z.number(),
    alerts_count: z.number()
  })
});
