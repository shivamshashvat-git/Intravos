# Intravos Backend Industrialization Audit Report
**Date**: 2026-04-17
**Status**: READ-ONLY SCAN COMPLETED

## 1. Executive Summary
The backend has been successfully modularized into a 5-domain architecture. Logic separation between `providers`, `core`, and `domains` is clean. However, a critical middleware ordering issue exists where the Subscription Gate is bypassed due to missing tenant context at the root router level.

## 2. Severity: Critical (Must Fix Before Deployment)

### 2.1 Subscription Gate Ordering
- **Location**: `backend/routes/index.js`
- **Issue**: `router.use(enforceSubscription)` is called before authentication.
- **Reason**: `enforceSubscription` needs `req.tenant`. `req.tenant` is only set by `authenticate` middleware, which is applied at the leaf routes.
- **Fix**: Remove global use from `index.js`. Rely on the call already inside `auth.js`.

### 2.2 Table Dependency (05 vs 06)
- **Location**: `backend/schema/`
- **Issue**: `booking_services` table is required for industrial operations but defined in Phase 06 (Marketplace).
- **Fix**: Ensure Phase 06 is applied before or alongside Phase 05, or move `booking_services` to a shared base.

## 3. Severity: High (Production Risks)

### 3.1 Environment Configuration Drift
- **Issue**: Missing variables in `.env.example`:
  - `GOOGLE_SERVICE_ACCOUNT_JSON`
  - `GOOGLE_DRIVE_FOLDER_ID`
  - `SUPABASE_DB_URL`
  - `FRONTEND_URL`
- **Fix**: Update `.env.example` immediately.

### 3.2 LeadService Logic Syntax
- **Location**: `backend/domains/crm/leads/lead.service.js:L59`
- **Issue**: `.not('status', 'in', '("completed","cancelled")')` is invalid Supabase query syntax.
- **Fix**: Change to `.not('status', 'in', ['completed', 'cancelled'])`.

## 4. Architectural Debt

### 4.1 Method Naming
- **Issue**: Controller methods like `get__0`, `post__3` in `bookings.controller.js` and `leads.controller.js`.
- **Fix**: Semantic renaming (e.g., `get__0` -> `listLeads`).

### 4.2 Error Handling Gaps
- **Issue**: Several internal service methods do not have explicit `try/catch` or logging.
- **Fix**: Wrap critical service logic in `try/catch` with `logger.error` before re-throwing.

## 5. Security Audit

### 5.1 Public Lead Ingestion
- **Issue**: `authenticateApiKey` for public lead captures does not check if the tenant is active/paid.
- **Risk**: Suspended accounts can still consume system resources via public forms.
- **Verdict**: Likely acceptable to keep lead flow alive, but should be a toggle.

### 5.2 Encryption Secrets
- **Issue**: `ENCRYPTION_KEY` is referenced but its rotation policy/presence in `core/config` is weak.
- **Fix**: Enforce 32-byte hex check on startup.

## 6. Verification Plan
- [ ] Run `npm test` to verify `auth.test.js` logic.
- [ ] Manual check of `softDelete.js` cascade logic.
- [ ] Verify `pdfEngine.js` pathing for newly moved templates.
