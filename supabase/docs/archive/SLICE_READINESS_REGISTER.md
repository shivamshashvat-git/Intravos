# SLICE READINESS REGISTER
**Project**: Intravos Backend Industrialization
**Date**: 2026-04-17
**Status**: ACTIVE (Updated after FIX 09 & Batch Verification)

## 1. Unified Risk & Issue Register

| Issue Title | Domain | Severity | Status | Blocks Slice(s) | Expected Symptom | Required Fix |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Broken Sub-route Bindings** | Operations | 🔴 Critical | ✅ **RESOLVED** | None | Fixed in [FIX 09]. | All 11 handlers wired to controller or explicit 501 stubs. |
| **Trash View Schema Mismatch** | System | 🔴 Critical | ✅ **RESOLVED** | None | Fixed in [FIX 09]. | SQL view columns `item_id` and `item_label` now match Service. |
| **Ghost Data in Trip Trees** | Operations | 🟠 High | ✅ **RESOLVED** | None | Fixed in [FIX 09]. | `ItineraryService` hydration now filters `deleted_at IS NULL`. |
| **Stranded Route Logic** | Operations | 🟠 High | ✅ **RESOLVED** | None | Fixed in [FIX 09]. | Recursive hydration moved to `ItineraryService`. |
| **Alpha PDF Templates** | Multi | 🟡 Medium | Partially Resolved | **Finance / Ops** | `500` on PDF download (Template missing or broken). | Verify Google Drive folder IDs and Local Template presence. |
| **Non-Semantic Marketplace** | Marketplace | 🟡 Medium | Deferred | **Marketplace** | Functional but difficult to read code. | Rename `get__0` style methods to `listSuppliers`, etc. |
| **Redundant /api Mount** | Core | 🔵 Low | Deferred | **All** | Duplicate results / confusion. | Standardize on `/api/v1` prefix and remove `/api` legacy mount. |
| **Missing lead_notes logic** | CRM | 🔵 Low | Deferred | **CRM** | Notes saved to DB but not visible in Detail view. | Enhance `LeadService.getLeadById` to include notes. |

---

## 2. Slice Readiness Status

### ✅ PILLAR: CRM (Leads & Customers)
- **Status**: **READY**
- **Approved Workflows**: Ingestion, Dashboard, Detail, Profiling.
- **Notes**: All core services industrialized and regression-verified.

### ✅ PILLAR: FINANCE (Quotes, Invoices, Payments)
- **Status**: **READY**
- **Approved Workflows**: Quotation builder, Invoice generation, Ledger synchronization, Multi-tenant banking scoping.
- **Notes**: Strict `tenant_id` guards applied to all ledger mutations in [FIX 08].

### ✅ PILLAR: MARKETPLACE (Read-Only)
- **Status**: **READY**
- **Approved Workflows**: Supplier directory, Public offer catalogs.
- **Notes**: Functional parity achieved; legacy naming persists as non-blocking debt.

### ✅ PILLAR: OPERATIONS (Itineraries & Bookings)
- **Status**: **READY**
- **Approved Workflows**: Trip building (Days/Items), Reordering, Duplication, Sharing, PDF generation.
- **Notes**: Unblocked by [FIX 09]. Advanced discovery/photos return explicit 501 stubs rather than crashing.

### 🟡 PILLAR: SYSTEM (Trash & Workspace)
- **Status**: **PARTIALLY READY**
- **Approved Workflows**: Workspace settings, Seat provisioning, Trash restoration/purging (Restoration now functional).
- **Notes**: Trash recovery verified after SQL/Service alignment in [FIX 09].

---

## 3. Error Watchlist for Frontend Integration

| Status Code | Likely Meaning | Guidance |
|:---|:---|:---|
| **401 Unauthorized** | JWT Expired or Missing | Prompt User Login. |
| **403 Forbidden** | RBAC / Subscription Gate | Check user role or check if tenant trial has expired. |
| **403 View Only** | Impersonation Mode | Mutations blocked by Platform Safety. Disable 'Save' buttons in UI. |
| **501 Not Implemented** | Explicit Stub | Occurs on `marketplace discovery`, `hotel photos`, and `mergeCustomers`. |
| **500 Server Error** | Unexpected Failure | Check logs. 500s for missing itinerary handlers are now fixed. |

---

## 4. Required Implementation Sequence

1.  **Phase 1: CRM Slice (Leads/Customers)** — Begin Now.
2.  **Phase 2: Finance Slice (Quotes/Invoices/Payments)** — Parallel work approved.
3.  **Phase 3: Operations Slice (Trip Builder)** — **Unblocked**. High priority for trip management.
4.  **Phase 4: Marketplace refinements** — Cleanup naming and non-critical debt.
5.  **Phase 5: Governance Hardening** — Trash enhancements, redundant /api mount removal, PDF alpha → stable.

---
**Audit Certification**: This Register is the single source of truth for the current backend state. It has been updated following **FIX 09** and **BATCH FIX VERIFICATION**.
