# Remaining Issues - Backend Audit Follow-up

This report tracks unresolved items from the [BACKEND_AUDIT.md](file:///Users/shivamshashvat/Documents/Antigravity/backend/BACKEND_AUDIT.md) after the Critical and High severity fixes.

---

## 1. Blocker before Frontend (API Surface Stability)

### 1.1 Inconsistent Controller Method Naming
- **Issue**: Methods in `leads.controller.js` and `bookings.controller.js` use auto-generated names like `get__0`, `post__3`, `get_id_2`.
- **Severity**: Medium (Architectural Debt)
- **Status**: Unresolved
- **Why it is a Blocker**: If the frontend build starts now, developers (or AI) will write API service layers targeting these non-semantic names. Renaming them later will require a search-and-replace across the entire frontend codebase.
- **Recommended Timing**: **IMMEDIATE**. Fix before starting the first React feature slice.

---

## 2. Safe to Defer until after First Frontend Slice (Maintainability)

### 2.1 Redundant API Routing (/api vs /api/v1)
- **Issue**: `app.js` mounts the same router on both `/api` and `/api/v1`.
- **Severity**: Medium (Structural Consistency)
- **Status**: Unresolved
- **Why it is not a Blocker**: Functional parity exists on both paths. The frontend can simply be instructed to use the `/api/v1` prefix exclusively.
- **Recommended Timing**: After the first domain (e.g., CRM) is fully functional in the UI.

### 2.2 Global Service Error Handling Gaps
- **Issue**: Internal service methods (especially in Finance and Marketplace) lack consistent `try/catch` wrapping and standardized logging.
- **Severity**: Medium (Observability)
- **Status**: Unresolved
- **Why it is not a Blocker**: The global `errorHandler.js` and `asyncHandler` in routes will catch most bubbles, but "context-aware" error messages are missing.
- **Recommended Timing**: During the "Hardening" phase of each specific domain.

---

## 3. Safe to Defer until Pre-Deployment Hardening (Security & DevOps)

### 3.1 Public API Subscription Gate Bypass
- **Issue**: `authenticateApiKey` (used for website leads) does not check if the tenant's subscription is active.
- **Severity**: Low/Security
- **Status**: Unresolved
- **Why it is not a Blocker**: Allowing leads to flow into a suspended account is often a business-positive "lead capture" strategy. Enforcement can be added as a configuration toggle later.
- **Recommended Timing**: Before final production launch.

### 3.2 Encryption Secrets Enforcement
- **Issue**: `ENCRYPTION_KEY` presence and 32-byte hex validation are not enforced on server startup.
- **Severity**: Low/Security
- **Status**: Unresolved
- **Why it is not a Blocker**: Dev environments usually skip this; only required for production token security.
- **Recommended Timing**: Deployment setup.

### 3.3 Sentry SDK v8 Compatibility Audit
- **Issue**: `setupExpressErrorHandler` usage in `app.js` may need adjustment for Sentry's latest breaking changes.
- **Severity**: Low/Infrastructure
- **Status**: Unresolved
- **Why it is not a Blocker**: Sentry is optional; the app functions correctly without it.
- **Recommended Timing**: During CI/CD pipeline setup.
