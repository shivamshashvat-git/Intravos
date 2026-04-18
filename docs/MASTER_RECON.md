# MASTER RECONCILIATION MATRIX — INTRAVOS SYSTEM AUDIT

This document serves as the ground-truth technical audit for the Intravos SaaS platform. It maps the relationship between the database schema, backend services, and frontend features to identify implementation gaps.

## 1. Module Implementation Matrix

| Module | Domain | Schema (Migrations) | Backend (Service + Routes) | Frontend (Pages + Hooks) | Status | Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth & Security** | System | `users`, `tenants` (00, 02) | `system/auth` | `LoginPage`, `useAuth` | LIVE | CLEAN |
| **Dashboard** | System | `dashboard_stats_cache` (15) | `crm/analytics`, `system` | `DashboardPage` | LIVE | CLEAN |
| **CRM Leads** | CRM | `leads`, `lead_notes` (03, 16) | `crm/leads` | `LeadsPage`, `useLeads` | LIVE | CLEAN |
| **CRM Customers**| CRM | `customers` (03) | `crm/customers` | `CustomersPage` | LIVE | CLEAN |
| **Operations Hub**| Operations | `bookings` (05, 10) | `operations/bookings` | `BookingsPage` | LIVE | CLEAN |
| **Itineraries** | Operations | `itineraries`, `items` (11) | `operations/itineraries` | `ItineraryBuilderPage` | LIVE | CLEAN |
| **Visa Tracker** | Operations | `visa_tracking` (12) | `operations/visa` | `VisaListPage` | LIVE | CLEAN |
| **Quotations** | Finance | `quotations` (04, 17) | `finance/quotations` | `QuotationsPage` | LIVE | CLEAN |
| **Invoices** | Finance | `invoices` (04) | `finance/invoices` | `InvoicesPage` | LIVE | CLEAN |
| **Billing/Payments**| Finance | `payment_transactions` (09) | `finance/payments` | `PaymentDrawer` | LIVE | CLEAN |
| **Tasks** | Operations | `tasks` (13) | `operations/tasks` | `TasksPage`, `useTasks` | LIVE | CLEAN |
| **Notifications** | System | `notifications` (13) | `system/notifications` | `NotificationsPage` | LIVE | CLEAN |
| **Marketplace** | Marketplace | `marketplace_suppliers` (06) | `marketplace/offers` | NONE | LATENT | NO_UI |
| **Vendor Ledger**| Finance | Tables exist (04) | `finance/vendor-ledger` | NONE | LATENT | NO_UI |
| **Expenses** | Finance | Tables exist (04) | `finance/expenses` | NONE | LATENT | NO_UI |
| **Trash Recovery**| System | `v_trash_items` (16) | `system/trash` | NONE | LATENT | NO_UI |
| **Public Portal** | System | Share token logic | `system/public` | `PublicItineraryPage` | LIVE | CLEAN |

**Status Legend:**
- **LIVE**: Schema + Backend + Frontend all exist and are connected.
- **LATENT**: Schema + Backend exist, Frontend absent or zero work.
- **SCAFFOLD**: Frontend files exist but are placeholders.
- **PARTIAL**: One or two layers missing.

---

## SECTION A — LIVE SURFACE
As of today, these features are fully operational and ready for use:
- **Lead Pipeline**: Agents can capture leads, log communications, and move them through a multi-stage pipeline.
- **Customer Directory**: Centralized management of traveler profiles and segmentation.
- **Tactical Itinerary Builder**: Full drag-and-drop builder for travel blueprints with Day and Item (Flight, Hotel, Activity) nodes.
- **Gotenberg PDF Engine**: Cold-generation of Quotations and Invoices with agency branding.
- **Booking Management**: Lifecycle tracking of bookings, including traveler manifests and service confirmation.
- **Visa Workflow**: Tracking passport custody and embassy status across multiple travelers.
- **Financial Ledger**: Recording payments, tracking outstanding balances, and managing bank account nodes.
- **Public Sharing**: Generating encrypted live links for clients to view their itineraries without authentication.

## SECTION B — HIDDEN CAPABILITY (LATENT MODULES)
These systems are fully built in the backend/schema but have NO user interface:
- **Marketplace Directory**: The backend supports supplier discovery and offer networking. *Action to surface: Build `features/marketplace` registry.*
- **Vendor Payables**: Ability to track how much the agency owes suppliers (Net Cost tracking). *Action to surface: Build "Vendor Ledger" in Finance.*
- **Recycle Bin**: Backend view `v_trash_items` is ready for data recovery. *Action to surface: Add "Trash" tab in System Settings.*
- **Bulk Import**: `backend/domains/system/import` supports CSV/Excel ingestion. *Action to surface: Build an Import Wizard in CRM settings.*

## SECTION C — GAPS AND RISKS
- **Gotenberg Sidecar**: The platform is now strictly dependent on a Gotenberg instance for all PDF exports. If the sidecar is offline, Quote/Invoice generation will fail with 500.
- **Single-Fetch Booking Hub**: All operations in `BookingDetailPage` rely on the `get_booking_hub` RPC. A schema change to `bookings` or `customers` without updating this RPC will crash the entire detail view.
- **Financial Blinder**: The `financialBlinder` middleware is active but untested with the new `markup-presets` logic. There is a risk of masking legitimate data during Quote/Invoice editing.
- **Stale Marketplace**: The `marketplace` domain has the most technical debt potential as it was built early and has zero frontend validation.

---

## V1 BOUNDARY (Complete Today)
- Core CRM, Operations (Bookings/Itineraries/Visas), and Finance (Quotes/Invoices/Payments) are 100% LIVE and high-fidelity.

## V1.1 CANDIDATES (Immediate Next Steps)
1. **Marketplace UI** (High Impact): Surfacing the B2B network to drive agency collaboration.
2. **Vendor Reconciliation** (Medium Impact): Closing the loop on financial integrity by tracking payouts.
3. **Audit Trail UI** (Low Impact/High Compliance): Displaying record history for transparency.

## V2 SCOPE (Future Strategic)
- Automated AI Lead Scoring (Predictive Analytics ready in backend).
- Integrated Booking Engine (GDS/API integrations).
- Mobile App (via Capacitor/PWA wrappers).
