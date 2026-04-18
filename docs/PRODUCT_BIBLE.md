# Intravos Product Bible
## The definitive architectural record for the Intravos SaaS Platform

This document serves as the high-fidelity engineering and product map for Intravos. It documents the core logic, design decisions, and hidden capabilities of the system as of April 2026. This is intended for future reference by the founders and lead architects to understand *why* things were built the way they were.

---

## 1. Core Architecture & Multi-Tenancy
Intravos is a multi-tenant travel agency operating system built on a **Node/Express/Supabase** stack.

### Logical Tenant Isolation
Unlike systems that use separate databases or schemas, Intravos uses **Logical Isolation**. 
- **Identity Layer**: Every user belongs to exactly one `tenant_id`. This is encoded into the JWT `app_metadata` and the `users` table.
- **Middleware Enforcement**: The `auth.js` middleware resolves the tenant from the JWT and attaches it to `req.tenant`. If the tenant is inactive or suspended (calculated by the `subscription` middleware), the request is blocked before it reaches the domain logic.
- **Service Layer Safety**: Most business logic extends `BaseService.js`, which automatically injects `.eq('tenant_id', this.tenantId)` into database queries. This provides a second layer of defense against cross-tenant data leaks.
- **RLS (Row Level Security)**: At the database level, Supabase RLS policies (see `07-security-rls.sql`) ensure that even direct SQL access is restricted to the tenant context currently in the session.

---

## 2. RBAC & The "Financial Blinder"
The system utilizes a hierarchical Role-Based Access Control model:
- `super_admin`: Platform owners. Can access the Admin HUD, manage tenants, and impersonate any user.
- `admin`: Agency owners. Full access to their own tenant’s data, including financial margins and staff management.
- `staff`: Agency employees. Operates the day-to-day CRM and Operations.

### The Financial Blinder Design
**Non-Obvious Decision**: Why intercept at `res.json`?
In `backend/core/middleware/financialBlinder.js`, the middleware overrides the Express `res.json` method. If the user is `staff`, it recursively scrubs keys like `cost_price`, `total_margin`, and `net_profit` from the response body.
- **The "Why"**: Traditional "Select" filters in controllers are prone to human error. A developer might add a field to a SQL query and forget to filter it for staff. By blinding at the **API edge**, we ensure that no matter how the data is fetched internally, it can NEVER leave the server if it contains sensitive agency margins.

---

## 3. The Subscription Lifecycle & Automation
The platform's business logic is heavily automated via cron jobs and RPCs.

### Subscription State Machine
The `subscription-lifecycle.js` job (and corresponding `CronService`) manages a complex state machine for tenants:
1. **Trial**: New signups get a timed trial.
2. **Active**: Paid subscribers.
3. **Grace**: If a payment fails or a trial ends, the tenant moves to `grace`. They still have full access but see warnings.
4. **Limited**: Post-grace, the system locks certain modules (e.g., Financials) but allows CRM access so they don't lose data.
5. **Suspended**: Full lockdown. No API requests allowed except for Billing/Support.
6. **Deactivated**: Soft-deleted status for churning tenants.

### The Backup Pipeline
`databaseBackupTask.js` performs a daily "industrial backup":
- It spawns a `pg_dump` process and pipes the stream directly through a `gzip` compressor.
- This compressed stream is then uploaded to **Google Drive** using the `googleDriveService`.
- **Significance**: By using streams instead of temporary files, the system can backup massive databases on low-memory servers without risking disk overflow.

---

## 4. The Database Evolution (Migration Map)
The system was built in 17 surgical steps:
- **00-01**: The foundation. Enums and the **Super Admin HUD** (the control center for Shivam).
- **02-03**: Tenant core and CRM. Handles the migration of agency identities and their customer bases.
- **04-05**: Financials and Operations. The birth of Invoices, Quotations, and Bookings.
- **06**: **Global Marketplace**. (Dormant Logic).
- **10-12**: High-specialization modules. Itineraries and the **Visa Tracking System**.
- **15**: **Dashboard Cache**. A dedicated table for "high-velocity metrics." Instead of calculating revenue on every page load, the system caches it for executive agility.
- **17**: **The Booking Hub RPC**. A "Phantom RPC" (`get_booking_hub`) that performs a deep hydration of a booking, its customer, its services, and its payments in a *single database round-trip*.

---

## 5. Operations: Visas & Itineraries
The system contains specialized logic for high-friction travel tasks:
- **Visa System**: Beyond simple tracking, it includes **Passport Custody** states (`at_agency`, `at_consulate`, `returned`). It enforces a unique constraint on `(visa_tracking_id, doc_type)` to ensure clean document management.
- **Itinerary Engine**: Designed for rich, multi-day storytelling. It supports "Day-wise" itemization with specific icons and categories.
- **PDF Engine**: 9 templates exist today. Most notable is the `travel_pack.hbs`, which is designed to be the "Master Document" handed to a traveler, consolidating vouchers, itineraries, and insurance in one branded PDF.

---

## 6. The Dormant Marketplace Domain
While the frontend is not fully surfaced, the `backend/domains/marketplace/` codebase is a complete, industrial-grade design.
- **Network**: A LinkedIn-like feed for travel agents to share "Offers" (inventory) and "Resources."
- **Quality Score**: Every post in the network has a `quality_score` calculated from peer votes to surface reliable suppliers.
- **Directory**: A global search index of across-tenant suppliers that can be "pinned" by an agency to their local supply chain.
- **Suppliers**: Handles "Agency-to-Vendor" ledgers and automated voucher generation.

---

## 7. The Health Score System
Located in `backend/domains/crm/analytics/clientHealth.js`, this system measures agency "health":
- **Metics**: Login recency + Business Velocity (Leads + Payments + Quotes created in 7 days).
- **Purpose**: It provides a "Red/Yellow/Green" flag in the Super Admin dashboard. If an agency's health is red, it's a signal to the founders to reach out for a "success call" before they churn.

---

## 8. Sudo Mode & Security
Inspired by Unix and high-security apps, the `sudo.js` middleware handles "high-stakes" actions.
- Any request to sensitive routes (like changing Bank Details or deleting a Tenant) requires a "Sudo Token."
- This token is short-lived and requires the user to re-verify their identity, even if they have an active session.

---

## 9. Future Features & Designed Vectors
Architectural breadcrumbs for the future:
- **IvoBot**: A designed `IvoBotService` for automated push/email notifications based on lifecycle events (e.g., "Visa rejected" triggers an automated IVO alert).
- **Marketplace Network Feed**: Ready to be activated to turn the SaaS into a B2B Social Network.
- **View-Only Impersonation**: Already built to allow support teams to help customers without the risk of deleting data.

---
**Summary for Shivam (Founder):**
The system is built to be "Saas-First." Every line of code assumes that hundreds of agencies will eventually share this engine. The security is at the edge (Blinder), the data is isolated at the heart (RLS), and the operations are optimized for travel (Visa/Itinerary/PDF).
