# Intravos — AI Agent Handover Document
**Project:** Intravos (Multi-Tenant Travel Agency SaaS)  
**Prepared:** 19 April 2026, 07:58 IST  
**Handover From:** Perplexity AI (Session Agent)  
**Handover To:** Incoming AI Agent  
**Client:** Shreya Srivastava, Delhi IN  

---

## 1. Project Overview

Intravos is a multi-tenant SaaS platform built for Indian travel agencies. It handles the full agency workflow: leads, quotations, bookings, invoices, itinerary building, visa tracking, supplier management, customer CRM, and a partner network. The platform is built on:

- **Frontend:** React (TypeScript), Tailwind CSS, Lucide icons
- **Backend:** Node.js + Express (`apiClient` pattern)
- **Database:** Supabase (PostgreSQL 17.6, project ID: `bjcjynpnebsrqukreuhv`, region: `ap-south-1`)
- **Auth:** Supabase Auth + `public.users` table sync
- **Repo location:** `/Users/shivamshashvat/Documents/Antigravity/`

---

## 2. What Has Been Completed

### Phase A — Backend Architecture Refactor ✅ COMPLETE

This was the primary work of the current session. All items below are done and verified on the live Supabase instance.

#### 2.1 Service Layer Migration
All 8 legacy `supabase-direct` service files were migrated to use `apiClient` (Node.js Express proxy). This eliminates direct Supabase queries from the browser, closing schema exposure vulnerabilities.

#### 2.2 Auth Pipeline Fix
- Identity hydration shifted from raw Supabase client queries to a centralized `GET /api/auth/me` endpoint
- `useAuth` hook now strictly requires a row in `public.users` (with a valid `tenant_id`) for `isAuthenticated: true`
- **Critical dependency:** A Supabase trigger must exist to auto-create a `public.users` row when a new `auth.users` record is inserted. **This trigger has NOT been verified as present — it must be confirmed before onboarding new users.**

#### 2.3 Schema — `visa_documents` Fix
A syntax error (`missing comma before UNIQUE constraint`) was blocking the full migration run. Fixed via targeted migration:

| Column/Constraint Added | Status |
|---|---|
| `storage_bucket TEXT` | ✅ Applied |
| `storage_path TEXT` | ✅ Applied |
| `deleted_at TIMESTAMPTZ` | ✅ Applied |
| `deleted_by UUID` | ✅ Applied |
| `UNIQUE(visa_tracking_id, doc_type)` | ✅ Applied |
| FK `deleted_by → users(id) ON DELETE SET NULL` | ✅ Applied |

**Migration name in Supabase:** `fix_visa_documents_columns_and_constraint`

#### 2.4 Schema File Audit (`schema_reference.sql`)
Three bugs identified in the consolidated migration file:

| Bug | Line | Status |
|---|---|---|
| Missing comma before `UNIQUE` in `visa_documents` | ~1182 | ✅ Fixed in DB (file fix pending manual edit) |
| Empty `DO $$` block for `uni_visa_track_doc` constraint | ~1200 | ⚠️ Empty block still in file — harmless but should be cleaned |
| Missing `COMMIT;` at end of transaction | EOF | ⚠️ Must be added to file before next full run |

#### 2.5 Dependency Stabilization
- `zod` and `jest` reverted to stable/existing versions in `package.json` (Zod v4 reference was causing `npm install` failures)
- `tenant_id` column restored on `public.users` table to prevent Admin Dashboard and User Management breakage

#### 2.6 `deleted_by UUID` Column
Added to 28 tables as part of the soft-delete audit trail. All existing named inserts remain safe — no positional `INSERT INTO ... VALUES (...)` patterns were found in the backend source.

---

## 3. Current State of the Live Database

**Supabase Project:** `bjcjynpnebsrqukreuhv` (ACTIVE_HEALTHY)

### Tables Present in Live DB (27 confirmed)
`bank_accounts`, `booking_services`, `bookings`, `coupons`, `customers`, `dashboard_stats_cache`, `invoice_items`, `invoices`, `itineraries`, `itinerary_days`, `itinerary_items`, `lead_communications`, `lead_notes`, `leads`, `notifications`, `payment_transactions`, `plans`, `platform_settings`, `quotation_items`, `quotations`, `sales_inquiries`, `suppliers`, `tasks`, `tenants`, `users`, `visa_documents`, `visa_tracking`

### Tables in `schema_reference.sql` NOT YET Applied to Live DB
The following tables exist in the schema file but are absent from the live database. They must be applied before the backend services that reference them will work:

| Table | Backend Service Dependency |
|---|---|
| `lead_followups` | `leads.service.js` |
| `lead_attachments` | `leads.service.js` |
| `lead_documents` | `leads.service.js` |
| `activity_logs` | `itinerary.service.js`, `trash.service.js` |
| `referrals` | `referrals.service.js` |
| `message_templates` | `communications.service.js` |
| `engagement_log` | `engagement.service.js` |
| `calendar_events` | `calendar.service.js` |
| `expense_categories` | `expenses.service.js` |
| `expenses` | `expenses.service.js` |
| `markup_presets` | `quotation.service.js` |
| `group_booking_members` | `bookings.service.js` |
| `visa_documents` (columns patched) | `visa.service.js` |
| `travel_insurance_policies` | `insurance.service.js` |
| `documents` | `documents.service.js` |
| `master_assets` | `assets.service.js` |
| `resource_hub_links` | `resource_hub.service.js` |
| `support_tickets` | `support.service.js` |
| `ticket_replies` | `support.service.js` |
| `post_trip_feedback` | `engagement.service.js` |
| `vendor_rate_cards` | `suppliers.service.js` |
| `agents_directory` | `agents.service.js` |
| `network_members` | `network.service.js` |
| `network_feed_posts` | `network.service.js` |
| `network_feed_comments` | `network.service.js` |
| `network_feed_reactions` | `network.service.js` |
| `network_opportunities` | `network.service.js` |
| `network_connections` | `network.service.js` |
| `network_messages` | `network.service.js` |
| `announcements` | `platform.service.js` |
| `announcement_dismissals` | `platform.service.js` |
| `platform_invoices` | `platform_billing.service.js` |
| `platform_payments` | `platform_billing.service.js` |
| `platform_changelog` | `platform.service.js` |
| `platform_prospects` | `sales.service.js` |
| `impersonation_sessions` | `auth.service.js` |
| `security_audit_logs` | `auth.service.js` |
| `coupon_usage_logs` | `coupons.service.js` |
| `customer_merge_logs` | `customers.service.js` |
| `associated_travelers` | `customers.service.js` |
| `tenant_settings` | `tenants.service.js` |
| `referrals` | `referrals.service.js` |
| `offers` | `offers.service.js` |
| `cancellations` | `cancellations.service.js` |
| `vendor_ledger` | `suppliers.service.js` |
| `miscellaneous_services` | `bookings.service.js` |
| `vouchers` | `bookings.service.js` |
| `workspace_messages` | `workspace.service.js` |
| `post_trip_feedback` | `feedback.service.js` |

---

## 4. Known Outstanding Issues

### 4.1 Broken Buttons / UI (Partially Diagnosed)
The client reported buttons not working after login. Root cause has **not been fully diagnosed** yet. Likely causes in priority order:

1. **Missing `public.users` trigger** — if the sync trigger is absent, any user whose `public.users` row was not manually created will be `isAuthenticated: false`, silently breaking all authenticated API calls
2. **Missing tables** — screens backed by tables not yet applied to the live DB will throw `relation does not exist` errors (these surface as broken buttons/blank screens, not visible errors in UI)
3. **RPC functions missing** — `rpc_get_monthly_pnl`, `get_booking_hub`, `find_duplicate_phones` are called by the backend but are **not in `schema_reference.sql`** and likely only exist in the Supabase instance from a prior manual run. These must be extracted and preserved.

### 4.2 Missing from `schema_reference.sql`
The schema file is **incomplete as a standalone deploy artifact**:

| Missing | Impact |
|---|---|
| Stored procedures / RPCs | Backend calls will 500 on fresh deploy |
| `updated_at` auto-update triggers | Timestamps stale on edits |
| User sync trigger (`auth.users` → `public.users`) | New signups silently broken |
| RLS policies (tenant isolation) | Multi-tenancy enforcement incomplete |
| `v_trash_items` view | Recycle bin UI non-functional |
| `financial_audit_log` table | Financial audit trail absent |

### 4.3 Naming Inconsistency
The backend references `sales_requests` in some service files, but only `sales_inquiries` exists in the schema. These need to be reconciled — either aliased, merged, or defined as distinct entities.

### 4.4 `v_trash_items` View — Incomplete Coverage
If a trash/recycle bin view exists, it currently covers only ~3 of the 49 soft-deletable tables. It needs expanding to include at minimum: `bookings`, `booking_services`, `invoices`, `itineraries`, `tasks`, `cancellations`, `suppliers`, `agents_directory`, `offers`.

---

## 5. Phase B — UI/UX Redesign (NOT STARTED)

The client explicitly flagged the UI as "terrible." Phase B is the next scheduled sprint. Nothing has been touched on the frontend yet. Key context:

- Current UI uses heavy black-italic headings, slate-900 accents, and unstyled Lucide icons
- No design system or token-based styling currently exists
- 25+ live screens need a full consistency pass
- Suggested approach: establish a design system first (tokens, typography, color palette), then apply screen-by-screen

The incoming agent should **not start Phase B** until the schema parity and broken-button issues from Phase A are fully resolved, as UI work built on broken data will need to be redone.

---

## 6. Immediate Next Actions for Incoming Agent

Priority order:

1. **Verify user sync trigger** — check Supabase Dashboard → Database → Triggers for a trigger on `auth.users INSERT` that creates a `public.users` row. If absent, create it immediately.
2. **Apply missing tables** — run the remaining tables from `schema_reference.sql` that are not yet in the live DB (see Section 3 table above).
3. **Extract and preserve RPCs** — dump `rpc_get_monthly_pnl`, `get_booking_hub`, `find_duplicate_phones` from the live Supabase instance and append to `schema_reference.sql`.
4. **Fix `schema_reference.sql`** — add missing `COMMIT;`, populate or delete the empty `uni_visa_track_doc` DO block, remove redundant ALTER TABLE blocks for columns that already exist inline in CREATE TABLE.
5. **Add `financial_audit_log` table** — append to Section 9 of `schema_reference.sql` and apply to live DB.
6. **Reconcile `sales_requests` vs `sales_inquiries`** — search backend source for all references and decide.
7. **Diagnose remaining broken buttons** — after the above, test each screen systematically.
8. **Begin Phase B (UI/UX)** — only after all above is stable.

---

## 7. Repository Structure (Key Paths)

```
/Users/shivamshashvat/Documents/Antigravity/
├── backend/
│   ├── src/
│   │   ├── services/         ← All domain service files (apiClient pattern)
│   │   ├── controllers/      ← auth.controller.js, etc.
│   │   └── middleware/
│   │       └── auth.js       ← JWT verification + public.users hydration
├── src/
│   └── hooks/
│       └── useAuth.tsx       ← Frontend auth hook (calls GET /api/auth/me)
└── supabase/
    └── schema_reference.sql  ← Master schema file (has 3 known bugs, see Section 2.4)
```

---

## 8. Supabase Project Reference

| Field | Value |
|---|---|
| Project Name | Intravos |
| Project ID | `bjcjynpnebsrqukreuhv` |
| Region | `ap-south-1` (Mumbai) |
| DB Host | `db.bjcjynpnebsrqukreuhv.supabase.co` |
| PostgreSQL Version | 17.6.1.104 |
| Status | ACTIVE_HEALTHY |

---

*Document prepared by Perplexity AI session agent on 19 April 2026 at 07:58 IST for handover to incoming agent.*
