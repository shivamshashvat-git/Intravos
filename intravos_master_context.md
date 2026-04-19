# Intravos — Complete Project Blueprint & AI Handover Document

> **Generated**: April 19, 2026  
> **Codebase Stats**: ~22K lines frontend (125 TSX/TS files) · ~19K lines backend (197 JS files) · 2,685-line PostgreSQL schema (78 tables) · 18 migration files

---

## Part 1: What is Intravos?

Intravos is a **multi-tenant SaaS platform** purpose-built for Indian travel agencies. It replaces fragmented tools (Excel sheets, WhatsApp groups, manual invoicing) with a unified system that handles every stage of the travel business lifecycle — from a customer's first inquiry to post-trip follow-ups and financial reconciliation.

**Business Model**: B2B SaaS. Each travel agency ("tenant") pays an annual subscription. A single "Super Admin" (the platform owner) manages all tenant accounts, billing, and platform health from a hidden admin panel.

**Target User**: Small-to-mid-sized Indian travel agencies with 2–15 staff members who handle domestic and international leisure/group travel.

---

## Part 2: Technical Architecture

### 2.1 Stack Overview

| Layer | Technology | Notes |
|:---|:---|:---|
| **Frontend** | React 19 + TypeScript + Vite 8 | Single-page app with `react-router-dom` v6 |
| **UI Framework** | TailwindCSS 3 + shadcn components | Uses `@fontsource-variable/geist`, `lucide-react` icons |
| **State Management** | Custom hooks per feature | No Redux/Zustand. Each feature has `useXxx.ts` hooks |
| **Backend** | Node.js 20+ / Express 4 (ESM) | Domain-driven folder structure |
| **Database** | PostgreSQL via Supabase | Row-level security, real-time subscriptions |
| **Auth** | Supabase Auth (JWT) | `app_metadata` carries `tenant_id` and `role` |
| **PDF Generation** | Gotenberg 8 (headless Chromium) | Handlebars templates → HTML → PDF via Gotenberg API |
| **File Storage** | Supabase Storage | 9 named buckets (uploads, logos, pdfs, rate-cards, etc.) |
| **Email** | Resend / SendGrid (configurable) | Handlebars templates for transactional emails |
| **Push Notifications** | Web Push (VAPID) | PWA-ready push via `web-push` npm package |
| **Error Tracking** | Sentry | Optional; silent if `SENTRY_DSN` unset |
| **Logging** | Pino + pino-http | Structured JSON logging |
| **Deployment** | Render.com (Docker) | `render.yaml` defines backend service |

### 2.2 Repository Structure

```
/
├── src/                          # FRONTEND (React/TypeScript)
│   ├── app/
│   │   ├── App.tsx               # Root router — 25 protected routes
│   │   └── main.tsx              # Vite entry point
│   ├── core/
│   │   ├── guards/ProtectedRoute # Auth gate
│   │   ├── hooks/useAuth.tsx     # Auth context + session management
│   │   ├── hooks/useSudo.ts      # Re-auth for sensitive actions
│   │   ├── hooks/useNotifications.ts
│   │   └── lib/
│   │       ├── apiClient.ts      # Centralized fetch with sudo-retry logic
│   │       └── supabase.ts       # Supabase client init
│   ├── features/                 # Feature modules (see §3)
│   │   ├── auth/                 # Login, Suspended pages
│   │   ├── crm/                  # Leads, Customers, Follow-ups
│   │   ├── dashboard/            # Agency dashboard
│   │   ├── finance/              # Quotations, Invoices, Vendor Ledger, Markup Presets
│   │   ├── operations/           # Bookings, Itineraries, Visas, Calendar, Insurance, Cancellations, Groups
│   │   ├── tasks/                # Tasks, Notifications
│   │   ├── settings/             # Agency settings, Team, Trash/Recycle Bin
│   │   ├── marketplace/          # (Deferred — B2B features)
│   │   ├── public/               # Public itinerary sharing page
│   │   └── system/               # Super Admin panel
│   ├── shared/
│   │   ├── components/           # AppShell, StatusBadge, PriorityBadge, CustomerSelector, etc.
│   │   └── layouts/              # Shared layout wrappers
│   └── utils/                    # Shared utility functions
│
├── backend/                      # BACKEND (Node.js/Express)
│   ├── server.js                 # HTTP server + graceful shutdown
│   ├── app.js                    # Express app setup (Helmet, CORS, Pino, rate limit)
│   ├── routes/index.js           # Top-level API router → domain routers
│   ├── core/
│   │   ├── config/index.js       # Env-based configuration
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification + impersonation resolution
│   │   │   ├── rbac.js           # Role + permission-based access control
│   │   │   ├── featureFlag.js    # Per-tenant + per-user feature gating
│   │   │   ├── subscription.js   # Subscription lifecycle enforcement
│   │   │   ├── financialBlinder.js  # Scrubs cost data from staff responses
│   │   │   ├── sudo.js           # Re-auth for destructive actions
│   │   │   ├── sanitizer.js      # XSS / payload sanitization
│   │   │   ├── validate.js       # Zod schema validation wrapper
│   │   │   └── cacheMiddleware.js
│   │   └── utils/
│   │       ├── softDelete.js     # 24-table TRASH_TABLES config + restore/purge logic
│   │       ├── BaseService.js    # Service base class
│   │       ├── cache.js          # In-memory TTL cache
│   │       ├── responseHandler.js
│   │       └── logger.js         # Pino wrapper
│   ├── domains/                  # Domain modules (see §3)
│   │   ├── auth/                 # Login, register, password reset, invite
│   │   ├── crm/                  # Leads, Customers, Follow-ups, Feedback, Referrals, Engagement, Analytics
│   │   ├── finance/              # Quotations, Invoices, Payments, Expenses, Vendor Ledger, Markup, Billing
│   │   ├── operations/           # Bookings, Itineraries, Visas, Tasks, Calendar, Insurance, Cancellations, Groups, Vouchers, Documents
│   │   ├── marketplace/          # Suppliers, Offers, Directory, Network, Resources (DEFERRED)
│   │   └── system/               # Admin, Tenants, Users, Trash, Notifications, Search, Uploads, Workspace, Support, Dashboard, Import, Announcements, Auth, Master Assets, Public/Sales
│   ├── jobs/                     # Background jobs
│   │   ├── cronService.js        # Daily maintenance orchestrator
│   │   ├── cron-tasks.js         # Individual task definitions
│   │   ├── cron.routes.js        # Cron trigger endpoints (secret-protected)
│   │   ├── databaseBackupTask.js # Google Drive export
│   │   └── subscription-lifecycle.js
│   └── providers/
│       ├── database/supabase.js  # supabaseAdmin + supabaseForUser factory
│       ├── communication/
│       │   ├── emailService.js   # Resend/SendGrid transactional email
│       │   ├── messageService.js # WhatsApp template rendering
│       │   ├── pushService.js    # Web Push notifications
│       │   ├── IvoBotService.js  # Automated anomaly detection bot
│       │   └── messagingService.js
│       ├── pdf-engine/
│       │   ├── pdfEngine.js      # Gotenberg-based PDF generation
│       │   └── templates/pdf/    # Handlebars .hbs templates + base.css
│       ├── places/               # Google Places API integration
│       └── storage/              # Supabase Storage wrapper
│
├── supabase/
│   ├── schema_reference.sql      # MASTER SCHEMA — single source of truth (2,685 lines)
│   └── migrations/               # 18 migration files (00–17)
│
├── gotenberg/                    # Docker config for Gotenberg PDF service
├── docs/                         # Archived documentation
└── frontend/                     # Legacy/alternate frontend artifacts
```

### 2.3 API Architecture

**Base URL**: `/api/v1` (also aliased at `/api` for backward compatibility)

**Authentication Flow**:
1. User logs in via Supabase Auth → receives JWT access token
2. Every request sends `Authorization: Bearer <token>`
3. Backend `auth.js` middleware verifies token via `supabaseAdmin.auth.getUser()`
4. Extracts `tenant_id` and `role` from `user.app_metadata`
5. Fetches full tenant profile (plan, features, subscription status)
6. Runs `enforceSubscription()` — blocks mutations if suspended/limited
7. Attaches `req.user`, `req.tenant`, `req.supabase` to request

**Impersonation** (Super Admin only):
- Send `x-impersonation-token` header → backend resolves to target user/tenant
- Read-only by default; must enable "Edit Mode" in session metadata for mutations

**Sudo Mode** (Sensitive actions):
- 403 with `requires_sudo: true` → frontend triggers password re-entry modal
- Frontend `apiClient.ts` automatically detects this and retries with `x-sudo-token`

**Domain Route Mounting**:
```
/api/v1/auth/*          → Auth domain
/api/v1/public/*        → Public endpoints (no auth)
/api/v1/cron/*          → Background job triggers (CRON_SECRET protected)
/api/v1/crm/*           → CRM domain (leads, customers, follow-ups, engagement, referrals, feedback, analytics)
/api/v1/operations/*    → Operations domain (bookings, itineraries, visas, tasks, calendar, insurance, cancellations, groups, vouchers, documents)
/api/v1/finance/*       → Finance domain (quotations, invoices, payments, expenses, vendor-ledger, markup-presets, billing)
/api/v1/system/*        → System domain (users, tenants, admin, trash, notifications, search, uploads, workspace, support, dashboard, import, announcements, master-assets)
```

---

## Part 3: The 5 Operational Pillars — Feature Deep Dive

### Pillar 1: Dashboard
- **Frontend**: `DashboardPage.tsx` with `useDashboard.ts` hook
- **Backend**: `dashboard.service.js` reads from `dashboard_stats_cache` table (pre-aggregated by daily cron)
- **Metrics**: Total revenue, active leads, conversion rate, pending payments, total bookings
- **Caching**: `cronService.refreshDashboardCache()` runs daily at 2 AM, processes tenants in batches of 10

### Pillar 2: CRM & Sales

**Leads Pipeline**:
- Full lifecycle: `new → contacted → quoted → negotiation → won → booked → completed → cancelled`
- Public lead ingestion via API key (`authenticateApiKey` middleware)
- Attached sub-entities: `lead_notes`, `lead_followups`, `lead_attachments`, `lead_documents`
- Follow-up reminders with due dates

**Customers**:
- Deduplicated customer profiles with `important_dates` (JSONB array of birthdays/anniversaries)
- Associated travelers (family/group members)
- `client_health` scoring via `healthService.js`

**Engagement Engine** (`engagement.service.js`):
- Scans upcoming birthdays, anniversaries, departures, and return dates
- Generates pre-filled WhatsApp URLs with template messages
- Dormant customer detection (6+ months since last trip)
- Message template management (`message_templates` table)

**Referrals**: Cross-tenant referral tracking with fulfillment workflow

### Pillar 3: Operations

**Booking Hub** (Core workflow):
- `get_booking_hub` PostgreSQL RPC: single-fetch deep hydration (booking + customer + services + payments)
- `booking_services`: Individual travel services (flights, hotels, transfers) with cost/sale price tracking
- Cascading soft-delete: Deleting a booking also archives its services
- Voucher generation for each service

**Itinerary Builder**:
- 3-level hierarchy: `itineraries` → `itinerary_days` → `itinerary_items`
- Drag-and-drop reordering (via `@dnd-kit`)
- Deep duplication (copies all days + items)
- Template system: "Promote to Template" and "Load from Template"
- Public sharing via unique `share_token` (renders `PublicItineraryPage.tsx` without auth)

**Visa Tracking**: Per-traveler visa application lifecycle with document management
**Travel Insurance**: Policy tracking with coverage details
**Cancellations**: Financial impact tracking (agency loss, supplier refund amounts)
**Group Bookings**: Multi-member booking management with bulk invoice generation
**Calendar**: Unified view of departures, check-ins, follow-ups, and task deadlines

### Pillar 4: Accounts & Finance

**Quotation → Invoice Pipeline**:
1. `quotations` with versioned `quotation_items` (line items with cost_price, sale_price, markup)
2. Approved quotation → converts to `invoices` + `invoice_items`
3. GST calculation: Automatic CGST/SGST (intra-state) or IGST (inter-state) split
4. PDF generation via Gotenberg with tenant branding

**Vendor Ledger**: Tracks what the agency owes each supplier (debit/credit entries)
**Markup Presets**: Reusable markup rules (percentage or fixed) per service type
**Expenses**: Category-based expense tracking with receipt uploads
**Payment Transactions**: Multi-payment tracking per lead/booking (partial payments, payment modes)
**Financial Audit Trail**: `financialAudit.js` logs before/after snapshots of financial changes (🔴 **`financial_audit_log` table missing from schema**)

**Financial Blinder** (`financialBlinder.js`):
- Middleware that recursively strips cost prices, margins, and profit data from API responses when the user has `role: 'staff'`
- Prevents staff from seeing agency markup/commission

### Pillar 5: Marketplace & System

**Marketplace** (⏸️ Deferred):
- `suppliers`, `agents_directory`, `offers`, `resource_hub_links`, `vendor_rate_cards`
- B2B network features: `network_connections`, `network_feed_posts`, `network_messages`, `network_opportunities`
- Routes are defined but commented out in `routes/index.js`

**System / Super Admin**:
- **Tenant lifecycle**: trial → active → grace → limited → suspended → archived
- **Platform billing**: `platform_invoices`, `platform_payments` (🔴 **tables missing from schema**)
- **Impersonation**: Login as any agency staff for support
- **Announcements**: Platform-wide feature announcements with dismissal tracking
- **Coupons**: Trial extension and discount codes
- **Prospects**: CRM for tracking potential new agency sign-ups
- **Global search**: Cross-module search across leads, customers, bookings, invoices

---

## Part 4: Database Schema Deep Dive

### 4.1 Schema File
**Source of Truth**: `/supabase/schema_reference.sql` (2,685 lines, 78 tables)

**Structure**:
1. **Section 1**: Extensions (`uuid-ossp`)
2. **Section 2**: Custom ENUM types (13 enums)  
3. **Section 3**: Table definitions (78 `CREATE TABLE IF NOT EXISTS`)
4. **Section 4**: Foreign key constraints (idempotent `DO` block with `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`)
5. **Section 5**: Database functions (`auth_tenant_id()`, `is_super_admin()`)
6. **Section 6**: Row-Level Security policies
7. **Section 7**: Views (`v_trash_items` — currently only covers leads, customers, quotations)
8. **Section 8**: Soft-deletion integrity (`deleted_by` column + FK for 49 tables)

### 4.2 Complete Table Inventory

**Core Identity (5 tables)**:
`tenants`, `users`, `plans`, `announcements`, `announcement_dismissals`

**CRM (10 tables)**:
`customers`, `associated_travelers`, `leads`, `lead_notes`, `lead_followups`, `lead_attachments`, `lead_documents`, `post_trip_feedback`, `referrals`, `client_health`

**Finance (11 tables)**:
`quotations`, `quotation_items`, `invoices`, `invoice_items`, `payment_transactions`, `expenses`, `expense_categories`, `vendor_ledger`, `markup_presets`, `bank_accounts`, `coupons`, `coupon_usage_logs`

**Operations (14 tables)**:
`bookings`, `booking_services`, `itineraries`, `itinerary_days`, `itinerary_items`, `visa_tracking`, `visa_documents`, `travel_insurance_policies`, `cancellations`, `tasks`, `calendar_events`, `documents`, `vouchers`, `group_booking_members`

**Communication (4 tables)**:
`notifications`, `message_templates`, `engagement_log`, `workspace_messages`

**Marketplace (10 tables)**:
`suppliers`, `agents_directory`, `offers`, `resource_hub_links`, `vendor_rate_cards`, `network_connections`, `network_feed_posts`, `network_feed_comments`, `network_feed_reactions`, `network_messages`, `network_opportunities`, `network_post_quality_ratings`

**Platform Governance (9 tables)**:
`platform_settings`, `platform_changelog`, `platform_invoices`, `platform_payments`, `platform_prospects`, `impersonation_sessions`, `sales_inquiries`, `support_tickets`, `ticket_replies`

**System (5 tables)**:
`activity_logs`, `dashboard_stats_cache`, `import_logs`, `master_assets`, `miscellaneous_services`

### 4.3 Multi-Tenancy Pattern
- Every tenant-scoped table has `tenant_id UUID NOT NULL REFERENCES tenants(id)`
- Backend always filters with `.eq('tenant_id', tenantId)` at the service layer
- RLS policies enforce tenant isolation at the database level as a secondary safety net

### 4.4 Soft-Deletion Pattern
- Every table has `deleted_at TIMESTAMPTZ DEFAULT NULL` and `deleted_by UUID`
- `deleted_by` has a FK to `users(id) ON DELETE SET NULL` (managed in Section 8 of schema)
- Queries always include `.is('deleted_at', null)` to exclude archived records
- 30-day retention policy: `cronService.purgeExpiredTrash()` permanently deletes items older than 30 days

---

## Part 5: Middleware Pipeline (Request Lifecycle)

Every authenticated request passes through this pipeline in order:

```
1. helmet()                  → Security headers
2. cors()                    → Origin whitelist
3. express.json()            → Body parsing (10MB limit)
4. pinoHttp()                → Request logging
5. payloadSanitizer          → XSS/injection scrubbing on req.body
6. financialBlinder          → Attaches response wrapper to strip cost data for staff
7. rateLimiter               → 200 req/15min (global), 10/15min (auth endpoints)
8. authenticate()            → JWT verification + tenant loading + impersonation resolution
9. enforceSubscription()     → Blocks mutations if tenant suspended/limited/archived
10. requireFeature()         → Per-route feature flag check
11. requireAdmin/Staff()     → Role-based access
12. validate(zodSchema)      → Request body validation (where applied)
13. [Controller → Service]   → Business logic execution
14. errorHandler             → Centralized error response formatting
```

---

## Part 6: Background Jobs & Automations

### Daily Maintenance (2:00 AM via cron trigger)
1. **Task Materialization**: Generates recurring task instances from templates
2. **Customer Health Scoring**: Recalculates engagement scores per customer per tenant
3. **Dashboard Cache Refresh**: Pre-aggregates revenue, bookings, leads metrics
4. **Subscription Cleanup**: Auto-suspends expired trials and active plans
5. **Trash Purge**: Permanently deletes soft-deleted records older than 30 days
6. **Database Backup**: Exports to Google Drive (non-fatal if credentials missing)

### 2-Hourly Bot Cycle (IvoBot)
1. **Stale Lead Detection**: Flags leads in "new" status for 3+ days
2. **Duplicate Phone Detection**: RPC-based deduplication scan
3. **Financial Mismatch**: Flags bookings with payments but no linked invoice

---

## Part 7: Security Architecture

| Feature | Implementation |
|:---|:---|
| **Authentication** | Supabase Auth JWT tokens; validated server-side on every request |
| **Authorization** | 4-tier RBAC: `super_admin` > `admin` > `platform_manager` > `staff` |
| **Feature Gating** | Per-tenant `features_enabled[]` array; per-user `features_override[]` optional |
| **Financial Security** | `financialBlinder` middleware strips cost/margin data from staff responses |
| **Sudo Mode** | Sensitive actions require password re-entry (15-minute window) |
| **Impersonation** | Super Admin can view-as any user; mutations blocked unless "Edit Mode" enabled |
| **Rate Limiting** | Global: 200/15min; Auth endpoints: 10/15min |
| **Input Sanitization** | `payloadSanitizer` middleware on all requests |
| **Tenant Isolation** | Service-layer `tenant_id` filtering + database RLS policies |
| **Data Retention** | 30-day soft-delete retention; 90-day post-deactivation data preservation |

---

## Part 8: Frontend Architecture

### Feature Module Pattern
Every feature follows this structure:
```
features/<name>/
├── pages/          # Route-level components (XxxPage.tsx)
├── components/     # Feature-specific UI (drawers, modals, cards)
├── hooks/          # Data-fetching + state (useXxx.ts)
├── services/       # API call functions (xxxService.ts)
└── types/          # TypeScript interfaces (xxx.ts)
```

### Frontend Routes (25 protected + 2 public)
```
/dashboard              → Agency dashboard
/leads                  → Lead pipeline list
/leads/:id              → Lead detail (notes, follow-ups, attachments, documents)
/customers              → Customer directory
/customers/:id          → Customer profile
/bookings               → Booking list
/bookings/:id           → Booking Hub (services, payments, documents, vouchers)
/bookings/groups        → Group bookings list
/bookings/groups/:id    → Group booking detail
/itineraries            → Itinerary list + template library
/itineraries/:id/edit   → Itinerary builder (drag-and-drop day/item editor)
/knowledge-bank         → Itinerary template gallery
/quotations             → Quotation list
/quotations/new         → Quote builder
/quotations/:id         → Quotation detail
/quotations/:id/edit    → Quote editor
/invoices               → Invoice list
/invoices/new           → Invoice builder
/invoices/:id           → Invoice detail
/invoices/:id/edit      → Invoice editor
/vendor-ledger          → Vendor payment tracking
/markup-presets         → Reusable markup rules
/visa                   → Visa application tracker
/insurance              → Travel insurance tracker
/cancellations          → Cancellation log
/calendar               → Unified calendar view
/tasks                  → Task management
/notifications          → Notification center
/settings               → Agency settings + team + trash

/login                  → Login page (public)
/trip/:share_token      → Shared itinerary (public)
```

### Key Shared Components
- **AppShell.tsx**: Main layout with sidebar navigation, notification bell, sudo modal
- **StatusBadge.tsx**: Configurable status pills
- **PriorityBadge.tsx**: Priority indicators
- **CustomerSelector.tsx**: Searchable customer dropdown
- **DocumentsTab.tsx**: Reusable file upload/management component
- **PlacesAutocomplete.tsx**: Google Places integration for location search
- **SudoModal.tsx**: Password re-entry dialog for sensitive actions

---

## Part 9: Environment Configuration

### Backend Environment Variables (from `.env.example`)
```
# Core
NODE_ENV, PORT (default: 4000)

# Supabase (required)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL

# Security
CORS_ORIGINS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, ENCRYPTION_KEY, CRON_SECRET

# External Services
GOTENBERG_URL, GOOGLE_PLACES_API_KEY, SENTRY_DSN, REDIS_URL

# Google Drive Backup
GOOGLE_DRIVE_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_JSON

# Email
EMAIL_FROM, RESEND_API_KEY, SENDGRID_API_KEY

# Push Notifications
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

# Storage (9 bucket names)
STORAGE_BUCKET_UPLOADS, STORAGE_BUCKET_SCREENSHOTS, STORAGE_BUCKET_ATTACHMENTS,
STORAGE_BUCKET_DOCUMENTS, STORAGE_BUCKET_OFFERS, STORAGE_BUCKET_LOGOS,
STORAGE_BUCKET_RATE_CARDS, STORAGE_BUCKET_PDFS, STORAGE_BUCKET_RECEIPTS
```

### Frontend Environment (`.env`)
```
VITE_API_URL           → Backend API base URL
VITE_SUPABASE_URL      → Supabase project URL
VITE_SUPABASE_ANON_KEY → Supabase anonymous key
```

---

## Part 10: Known Gaps & Risks

### 🔴 Critical (Schema-Backend Drift — Will Cause Runtime Errors)

| Missing Table | Backend File Using It | Impact |
|:---|:---|:---|
| `financial_audit_log` | `finance/shared/financialAudit.js` | Price change audit trail silently fails |
| `sales_requests` | `system/admin/admin.service.js` | Super Admin sales tracking crashes |
| `security_audit_logs` | `core/middleware/sudo.js` | Sudo mode audit logging fails |

### 🟡 Moderate (Incomplete Coverage)

| Issue | Detail |
|:---|:---|
| **Trash View** | `v_trash_items` only covers `leads`, `customers`, `quotations`. Backend `TRASH_TABLES` config supports 24 tables. The SQL view needs expansion. |
| **Marketplace Routes** | Commented out in `routes/index.js`. All domain code exists but is inaccessible. |
| **Zod Validation** | Finance domain has strict Zod coverage. Operations domain routes mostly lack request body validation. |
| **GoogleDrive backup** | Warns on every boot due to placeholder credentials. Needs graceful degradation. |

### 🟢 Low Priority

| Issue | Detail |
|:---|:---|
| Controller method naming | Group bookings controller uses numeric suffixes (`post_bookingId_members_1`). Should be semantic names. |
| RLS policy coverage | Base RLS policies exist but may not cover all 78 tables. Needs audit. |
| `find_duplicate_phones` RPC | Referenced by IvoBot but not defined in `schema_reference.sql`. |

---

## Part 11: Architectural Rules for AI Agents

1. **Multi-tenancy is non-negotiable**. Every query MUST filter by `tenant_id`. Cross-tenant data leakage is a critical security violation.

2. **`schema_reference.sql` is the single source of truth** for database structure. Individual migration files may be stale. Always modify the master schema.

3. **Idempotency pattern for SQL**: Use `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`, and wrap complex logic in `DO $$ BEGIN ... END $$` blocks.

4. **Soft-delete, never hard-delete** user-facing data. Set `deleted_at` + `deleted_by`. Only the 30-day cron purge does hard deletes.

5. **Foreign key safety**: Use `ON DELETE SET NULL` for user references, `ON DELETE CASCADE` only for true child entities (e.g., `itinerary_items` when `itinerary_days` is deleted). Never cascade-delete across business domain boundaries.

6. **Feature module pattern**: Frontend features must follow `pages/components/hooks/services/types` structure. Backend domains must follow `controller/routes/service` triad.

7. **Financial data is classified**. Cost prices, margins, and profit fields must be stripped from staff-role responses. The `financialBlinder` middleware handles this automatically.

8. **Subscription enforcement is automatic**. The `enforceSubscription` middleware handles all lifecycle states. Never bypass it — even for testing.

9. **PDF generation requires Gotenberg**. Without `GOTENBERG_URL`, all PDF features (invoices, quotations, itineraries) will fail. For local development, run Gotenberg via Docker.

10. **Premium UI is mandatory**. This is a paid SaaS product. Simple/generic designs are unacceptable. Use modern typography (Geist font is already configured), vibrant color palettes, and micro-animations.
