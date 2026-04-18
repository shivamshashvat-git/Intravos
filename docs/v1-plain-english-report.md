# Intravos V1: Platform Status Report

## SECTION 1: PLATFORM OVERVIEW

Intravos is a specialized multi-tenant SaaS platform designed for travel agencies to industrialize their sales and operations. It provides a surgical interface for managing the entire traveler lifecycle.

- **Frontend:** Built with React/Vite for an ultra-fast, single-page application experience.
- **Backend/Database:** Powered by Supabase (PostgreSQL) for secure, real-time data persistence.
- **Authentication:** Multi-tenant auth system ensuring agencies can only see their own data.
- **Storage:** Cloud-based storage for traveler documents and agency logos.

### Database Architecture (21 Tables)
The system is powered by 21 tables grouped into key domains:
- **Core:** `tenants`, `users`, `bank_accounts`
- **CRM:** `leads`, `lead_notes`, `lead_communications`, `lead_followups`, `customers`
- **Finance:** `quotations`, `quotation_items`, `invoices`, `invoice_items`, `payment_transactions`
- **Operations:** `bookings`, `booking_members`, `itineraries`, `itinerary_days`, `itinerary_items`, `visa_tracking`, `visa_documents`
- **Feedback:** `customer_feedback`

### Routes and Navigation
- `/dashboard` → `DashboardPage` → Executive command center with alerts and pipeline health.
- `/leads` → `LeadsPage` → The sales funnel for tracking inquiries and follow-ups.
- `/leads/:id` → `LeadDetailPage` → Deep-dive into a specific inquiry with timeline and visa tracking.
- `/customers` → `CustomersPage` → Directory of all travelers and corporate clients.
- `/quotations` → `QuotationsPage` → List of all generated proposals.
- `/quotations/new` → `QuoteBuilderPage` → Professional proposal generator with margin calculation.
- `/invoices` → `InvoicesPage` → GST-compliant billing and payment tracking.
- `/bookings` → `BookingsPage` → Operational overview of all upcoming/active trips.
- `/tasks` → `TasksPage` → Team-wide daily operational board.
- `/settings` → `SettingsPage` → Agency configuration and team management.

---

## SECTION 2: MODULE VERIFICATION

### Module 01: CRM (Leads & Timeline)
**What the user sees:** A visual funnel of every potential customer inquiry. It includes a "Neural Node Feed" (timeline) that tracks every call, message, and note taken during the sales process.

### Module 02: Customers & Traveler Profiles
**What the user sees:** A central database of all clients. Each profile tracks past bookings, total spend, and contact details, allowing for high-touch relationship management.

### Module 03: Quotation Builder
**What the user sees:** A drag-and-drop workspace to build professional travel proposals. It automatically calculates margins and handles multi-item breakdowns for hotels, flights, and activities.

### Module 04: GST Invoice Engine
**What the user sees:** A billing system that generates GST-compliant invoices. It handles local vs. interstate tax logic and allows for real-time payment recording.

### Module 05: Bookings & Group Manifest
**What the user sees:** Once a lead is "converted," it becomes an operational booking. This module allows agencies to manage group members, room sharing, and vendor costs.

### Module 06: Itinerary Sequencer
**What the user sees:** A tool to build day-by-day trip schedules that can be shared with customers via a unique public link.

### Module 07: Visa Tracking & Compliance
**What the user sees:** A dedicated panel inside each lead to track visa applications for multiple travelers. It monitors passport custody and document status (verified/pending).

### Module 08: Tasks & Neural Feed
**What the user sees:** A global operations board for the team. It shows what is due today and provides automated notifications via the "Neural Node" bell icon.

### Module 09: Settings & Branding
**What the user sees:** A control panel to set agency logos, colors, bank details, and invoice prefixes.

### Module 10: Executive Dashboard
**What the user sees:** The morning pulse of the agency. It highlights overdue follow-ups, today's departures, and monthly revenue performance at a glance.

---
**Report generated for Intravos V1 Launch.**
