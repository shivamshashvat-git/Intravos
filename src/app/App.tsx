import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/core/hooks/useAuth';
import { ProtectedRoute } from '@/core/guards/ProtectedRoute';
import { AppShell } from '@/shared/components/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { SuspendedPage } from '@/features/auth/pages/SuspendedPage';
import { LeadsPage as Leads } from '@/features/crm/pages/LeadsPage';
import { LeadDetailPage as LeadDetail } from '@/features/crm/pages/LeadDetailPage';
import { CustomersPage as Customers } from '@/features/crm/pages/CustomersPage';
import { CustomerDetailPage as CustomerDetail } from '@/features/crm/pages/CustomerDetailPage';
import { QuotationsPage as Quotations } from '@/features/finance/pages/QuotationsPage';
import { QuoteBuilderPage as QuoteBuilder } from '@/features/finance/pages/QuoteBuilderPage';
import { QuotationDetailPage as QuotationDetail } from '@/features/finance/pages/QuotationDetailPage';
import { InvoicesPage as Invoices } from '@/features/finance/pages/InvoicesPage';
import { InvoiceBuilderPage as InvoiceBuilder } from '@/features/finance/pages/InvoiceBuilderPage';
import { InvoiceDetailPage as InvoiceDetail } from '@/features/finance/pages/InvoiceDetailPage';
import { SettingsPage as Settings } from '@/features/settings/pages/SettingsPage';
import { BookingsPage as Bookings } from '@/features/operations/pages/BookingsPage';
import { BookingDetailPage as BookingDetail } from '@/features/operations/pages/BookingDetailPage';
import { TasksPage as Tasks } from '@/features/tasks/pages/TasksPage';
import { NotificationsPage as Notifications } from '@/features/tasks/pages/NotificationsPage';
import { ItinerariesPage as Itineraries } from '@/features/operations/pages/ItinerariesPage';
import { KnowledgeBankPage as KnowledgeBank } from '@/features/operations/pages/KnowledgeBankPage';
import { ItineraryBuilderPage as ItineraryBuilder } from '@/features/operations/pages/ItineraryBuilderPage';
import { PublicItineraryPage as PublicItinerary } from '@/features/public/pages/PublicItineraryPage';
import { VisaListPage as VisaTracking } from '@/features/operations/pages/VisaListPage';
import { DashboardPage as Dashboard } from '@/features/dashboard/pages/DashboardPage';
import { VendorLedgerPage as VendorLedger } from '@/features/finance/pages/VendorLedgerPage';
import { MarkupPresetsPage as MarkupPresets } from '@/features/finance/pages/MarkupPresetsPage';
import { ExpensesPage as Expenses } from '@/features/finance/pages/ExpensesPage';
import { CalendarPage as CalendarView } from '@/features/operations/pages/CalendarPage';
import { InsurancePage as Insurance } from '@/features/operations/pages/InsurancePage';
import { CancellationsPage as Cancellations } from '@/features/operations/pages/CancellationsPage';
import { GroupBookingsPage as GroupBookings } from '@/features/operations/pages/GroupBookingsPage';
import { GroupBookingDetailPage as GroupBookingDetail } from '@/features/operations/pages/GroupBookingDetailPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/suspended" element={<SuspendedPage />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/itineraries" element={<Itineraries />} />
            <Route path="/itineraries/:id/edit" element={<ItineraryBuilder />} />
            <Route path="/knowledge-bank" element={<KnowledgeBank />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/quotations/new" element={<QuoteBuilder />} />
            <Route path="/quotations/:id" element={<QuotationDetail />} />
            <Route path="/quotations/:id/edit" element={<QuoteBuilder />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceBuilder />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<InvoiceBuilder />} />
            <Route path="/vendor-ledger" element={<VendorLedger />} />
            <Route path="/markup-presets" element={<MarkupPresets />} />
            <Route path="/finance/expenses" element={<Expenses />} />
            <Route path="/visa" element={<VisaTracking />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/cancellations" element={<Cancellations />} />
            <Route path="/bookings/groups" element={<GroupBookings />} />
            <Route path="/bookings/groups/:id" element={<GroupBookingDetail />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Public Routes */}
          <Route path="/trip/:share_token" element={<PublicItinerary />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
