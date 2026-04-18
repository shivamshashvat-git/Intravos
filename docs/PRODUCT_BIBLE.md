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
- **RLS (Row Level Security)**: At the database level, Supabase RLS policies (`07-security-rls.sql`) ensure that even direct SQL access is restricted to the tenant context currently in the session.

### The Middleware Pipeline
The API enforces several powerful, globally applied middlewares:
- **`payloadSanitizer`**: A global safety net for `POST`/`PUT`/`PATCH` requests. It recursively strips away protected keys like `tenant_id`, `deleted_at`, and `profit` before they ever reach a controller. This prevents malicious "mass assignment" attacks.
- **`cacheMiddleware`**: Intercepts `GET` requests and serves them from Redis. If it's a miss, it cleverly overrides `res.json` so that when the controller responds, the middleware captures the output, caches it, and then transmits it.
- **`featureFlag`**: Manages both tenant-level features (`features_enabled`, `features_locked`) and user-level overrides (`features_override`). This allows an agency to restrict an intern from seeing reports, even if the agency pays for the reporting module.

---

## 2. RBAC, Sudo Mode & The "Financial Blinder"
The system utilizes a hierarchical, yet granular, Role-Based Access Control model defined in `rbac.js`:
- `super_admin`: Platform owners. Can access the Admin HUD, manage tenants, and impersonate any user.
- `admin`: Agency owners. Full access to their own tenant’s data.
- `platform_manager`: A read-only support role meant for Intravos internal employees.
- `staff`: Agency employees. Operates on a granular permission JSON grid (e.g. `permissions.crm = ['read', 'write']`).

### The Financial Blinder Design
**Non-Obvious Decision**: Why intercept at `res.json`?
In `financialBlinder.js`, the middleware overrides the Express `res.json` method. If the user is `staff`, it recursively scrubs keys like `cost_price`, `total_margin`, and `net_profit` from the response body.
- **The "Why"**: Traditional "Select" filters in controllers are prone to human error. By blinding at the **API edge**, we ensure that no matter how the data is fetched internally, it can NEVER leave the server if it contains sensitive agency margins.

### Sudo Mode (`sudo.js`)
Inspired by Unix, highly sensitive routes (e.g., changing Bank Details) require an `x-sudo-token`. The frontend forces the user to re-type their password to get this 15-minute token. It logs a `sudo_auth_success` event to `security_audit_logs`.

---

## 3. The Automation Engine & Subscription Lifecycle
The platform's business logic is heavily automated via cron jobs (`cronService.js`) and RPCs.

### Subscription State Machine
The `subscription-lifecycle.js` job manages a complex state machine for tenants:
1. **Trial**: New signups get a timed trial.
2. **Active**: Paid subscribers.
3. **Grace**: If a payment fails, the tenant moves to `grace`. They still have full access but see warnings.
4. **Limited**: Post-grace, the `subscription.js` middleware locks the account to `GET` requests only. They can read their CRM but cannot mutate data.
5. **Suspended**: Full lockdown. No API requests allowed except for Billing.
6. **Deactivated**: Soft-deleted status. Data is retained for 90 days before permanent deletion.

### The Backup Pipeline
`databaseBackupTask.js` performs a daily "industrial backup":
- It spawns a `pg_dump` process and pipes the stream directly through a `gzip` compressor.
- This compressed stream is uploaded to **Google Drive**. By using streams instead of temporary files, the system can back up massive databases on low-memory servers quickly.

### IvoBot Service
Intravos features a triple-role intelligence bot (`IvoBotService.js`) running on cron:
- **Agency Bot**: Runs hygiene checks. It scans for "stale leads" (unquoted for 3+ days), duplicate phone numbers, and "financial mismatches" (bookings that have registered payments but no generated invoice). It drops alerts into the `notifications` table.

---

## 4. The Database Evolution (Migration Map)
The system was built in 17 surgical steps via Supabase Migrations:
- **00-01**: Enums and the **Super Admin HUD** (the control center for the platform owners).
- **02-03**: Tenant core and CRM.
- **04-05**: Financials and Operations. Invoices, Quotations, and Bookings.
- **06**: **Global Marketplace**. Network feeds, directories, and ratings (see Section 6).
- **09 & 14**: Payment Transactions and Bank Accounts.
- **10-12**: High-specialization modules: Visas and Itineraries.
- **13**: **Operations Tasks**. The foundation for the notifications system and staff assignment.
- **15**: **Dashboard Cache**. A dedicated table for "high-velocity metrics." Instead of calculating revenue on every page load, it caches it for executive agility.
- **17**: **The Booking Hub RPC**. A "Phantom RPC" (`get_booking_hub`) that performs a deep hydration of a booking, its customer, its services, and its payments in a *single database round-trip*.

---

## 5. Operations: PDF Generation, Visas & Tasks
### The PDF Engine (`pdfEngine.js`)
Uses headless Puppeteer to generate high-fidelity, agency-branded PDFs.
- It dynamically injects the tenant's `logo_url`, `primary_color`, `gstin`, and `pan`.
- **Templates Available**: `platform_invoice`, `booking_confirmation`, `quotation`, `travel_pack`, `invoice`, `itinerary`, `payment_receipt`, `voucher`.
- **The Travel Pack**: The "Master Document" designed to be handed to a traveler, consolidating vouchers, itineraries, and insurance in one branded PDF.

### Specialized Operations
- **Visa System**: Tracks Passport Custody states (`at_agency`, `at_consulate`, `returned`). Enforces a unique constraint on `(visa_tracking_id, doc_type)` to prevent messy file duplication.
- **Task Management**: Tied directly to bookings and leads, tasks act as the human counterpart to IvoBot's automated notifications.

---

## 6. The Dormant Marketplace Domain
While the frontend is not fully surfaced, the `backend/domains/marketplace/` codebase is a complete, industrial-grade B2B social architecture:
- **Network**: A LinkedIn-like feed for travel agents to share "Offers" (inventory) and "Resources."
- **Quality Score**: Every post in the network has a `quality_score` calculated from peer votes to surface reliable suppliers automatically.
- **Directory**: A global search index of across-tenant suppliers that can be "pinned" by an agency to their own local supply chain.
- **Suppliers**: Handles "Agency-to-Vendor" ledgers (`vendor_ledger`) and automated voucher generation.

---

## 7. Platform Communication & Health
### Communications (`emailService.js`)
A hardened utility supporting **Resend** (Primary) and **SendGrid** (Fallback). 
- Automated flows include `sendWelcomeEmail`, `sendInvoiceEmail`, `sendTrialExpiryAlert`, and a `sendSecurityAlert` triggered when a login from a new IP/Device is detected.

### The Health Score System
Located in `clientHealth.js`, this system measures an agency's "health":
- **Metrics**: Login recency + Business Velocity (number of Leads + Payments + Quotes created in the last 7 days).
- **Purpose**: It provides a "Red/Yellow/Green" flag in the Super Admin dashboard. If an agency's health is red, it signals the platform founders to intervene with a "success call" before the user churns.

---

## 8. View-Only Impersonation
A critical security design in `auth.js`. When a `super_admin` uses their token to impersonate a tenant (for support purposes), the active session tracks a `is_edit_mode` flag. If the admin attempts a `POST/PUT/PATCH` while not explicitly in Edit Mode, the server rejects it. This protects both the customer's data integrity and the platform owner's liability.
