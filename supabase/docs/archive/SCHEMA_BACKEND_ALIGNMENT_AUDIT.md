# SCHEMA–BACKEND ALIGNMENT AUDIT
**Date**: 2026-04-17
**Status**: AUDIT COMPLETE (Bifurcated: Core Aligned / Ledger Risks)

## 1. Executive Summary
The Intravos system shows a strong structural alignment for "Phase 1" Core Pillars (Leads, Customers, Quotations). However, serious "Sync Drift" and "Security Bypass" risks exist in the Finance/Ledger modules where the backend logic omits tenant scoping in admin-level updates.

- **Overall Alignment**: **85%**
- **Critical Risks**: 1 (Tenant Scoping in Financial Sync)
- **High Risks**: 2 (Enum Mismatches, Denormalization Drift)
- **Primary Drift Area**: Automated Ledger Aggregations.

---

## 2. Workflow Inventory

### CRM (Leads & Customers)
- **Lead Ingestion**: External (API Key) and Internal (Manual) lead creation.
- **Customer Lifecycle**: Profiling, segmentation, and merging of duplicate identities.
- **Engagement**: Recording interactions (WhatsApp/Call) and scheduling follow-ups.

### Operations (Bookings & Logistics)
- **Itinerary Design**: Building multi-day travel plans with nested items (Hotels/Flights).
- **Booking Fulfillment**: Converting quotes to confirmed bookings; managing traveler lists.
- **Support Operations**: Task management, visa tracking, and document handling.

### Finance (Financial Control)
- **Quotation**: Professional cost estimation with GST compliance.
- **Invoicing**: Tax invoice generation and payment tracking.
- **Ledger**: Synchronized updates across Bank Accounts, Lead collections, and Vendor payables.

---

## 3. Findings by Severity

### 🔴 CRITICAL: Multi-tenant Security Bypass in Ledger Sync
- **Domain**: Finance / System
- **Files**: `backend/domains/finance/payments/payment.service.js` (Lines 125, 131), `07-security-rls.sql`
- **Issue**: The `_syncBankAccount` method update uses `id` only without `tenant_id`. Since it uses `supabaseAdmin`, it bypasses RLS.
- **Impact**: A malicious or buggy request could update the bank balance of another tenant if the `account_id` is known.
- **Recommended Fix**: Add `.eq('tenant_id', tenantId)` to all `update` and `delete` calls in services, even when using ID.

### 🟠 HIGH: Enum Drift in Lead Generation
- **Domain**: CRM
- **Files**: `backend/domains/crm/leads/leads.routes.js` (Line 28), `00-base-enums-and-extensions.sql` (Line 19)
- **Issue**: SQL Enum `lead_source` includes `whatsapp` and `instagram`, but Backend Zod schema `leadPublicSchema` excludes them.
- **Impact**: External leads from WhatsApp/Instagram will fail validation at the boundary, breaking ingestion workflows.
- **Recommended Fix**: Synchronize Zod enums with SQL definitions.

### 🟠 HIGH: Denormalization Drift in Leads
- **Domain**: CRM
- **Files**: `backend/domains/crm/leads/lead.service.js`, `03-tenant-crm.sql`
- **Issue**: Schema `leads` uses `travel_start_date` as its primary travel anchor, but Backend validation and some services prefer `checkin_date` / `checkout_date`.
- **Impact**: Inconsistent data state where a lead might have room/guest info but valid travel dates are stored in "Check-in" while "Travel Start" remains null.
- **Recommended Fix**: Consolidate date fields. Prefer `travel_start_date` as the master anchor for the CRM view.

### 🟡 MEDIUM: "Ghost Items" in Itinerary Soft-Delete
- **Domain**: Operations
- **Files**: `backend/domains/operations/itineraries/itinerary.service.js` (Line 33)
- **Issue**: `getItineraryById` joins days/items but does not filter out `deleted_at IS NOT NULL` records from the nested selection.
- **Impact**: Deleted days or items will reappear in the UI if the user refreshes, despite being "archived".
- **Recommended Fix**: Use `itin.itinerary_days.filter(d => !d.deleted_at)` in the service or apply explicit filters in the query.

### 🔵 LOW: Incomplete Trash View
- **Domain**: System
- **Files**: `07-security-rls.sql` (Line 47)
- **Issue**: `v_trash_items` only aggregates Leads, Customers, and Quotations.
- **Impact**: Global "Trash" UI won't show deleted Invoices, Tasks, or Expenses unless queried individually.
- **Recommended Fix**: Update the `UNION ALL` view to include all soft-deleteable entities.

---

## 4. Domain-by-Domain Alignment

| Domain | Status | Observations |
|:---:|---:|:---|
| **CRM** | ✅ **ALIGNED** | Excellent 1:1 mapping between `leads`/`customers` tables and backend objects. |
| **Operations** | ⚠️ **PARTIAL** | `itineraries` tree structure is correctly mirrored in logic, but soft-delete propagation is weak. |
| **Finance** | ⚠️ **PARTIAL** | Ledger logic is robust but lacks strict tenant safety in certain private helper methods. |
| **Marketplace** | ✅ **ALIGNED** | `suppliers` and `offers` schemas are well-formed and used consistently. |
| **System** | ✅ **ALIGNED** | `tenants`, `users`, and `announcements` are tightly integrated with auth flow. |

---

## 5. Final Verdict

### **SCHEMA & BACKEND ALIGNED FOR CORE PILLARS: YES**

**Blockers for Production Readiness**:
1. **Critical**: Fix `recordCustomerPayment` and `recordSupplierPayment` to enforce `tenant_id` on all sub-updates (Bank Accounts, Leads, Invoices).
2. **High**: Update Zod enums for `lead_source` to include all SQL values.

**Deferred Schema Debt**:
- Add secondary indexes for `tenant_id` + `deleted_at` combinations.
- Expand `v_trash_items` to cover the full operational surface.
- Denormalize `itinerary_summary` into `bookings` to avoid heavy joins in the financial ledger.
