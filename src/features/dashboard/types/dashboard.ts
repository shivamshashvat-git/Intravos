export interface RevenueTrendPoint {
  month: string;
  collected: number;
}

export interface DashboardData {
  leads: {
    active_leads: number;
    leads_today: number;
    leads_this_month: number;
    converted_this_month: number;
    status_counts: Record<string, number>;
  };
  followups: {
    overdue_followups: number;
  };
  revenue: {
    invoiced_this_month: number;
    collected_this_month: number;
    outstanding: number;
  };
  overdueInvoices: {
    overdue_invoices: number;
    overdue_amount: number;
  };
  bookings: {
    confirmed_bookings: number;
    active_bookings: number;
    departures_today: number;
    returns_today: number;
  };
  myTasks: {
    my_tasks_today: number;
    my_overdue_tasks: number;
  };
  visaAlerts: {
    passports_at_agency: number;
  };
  recentLeads: any[];
  upcomingDepartures: any[];
  revenueTrend: RevenueTrendPoint[];
}

export interface AlertItem {
  id: string;
  type: 'red' | 'amber' | 'blue';
  title: string;
  message: string;
  cta: string;
  link: string;
  icon: any;
}
