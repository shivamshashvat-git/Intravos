# Architectural Blueprint: The Domain-Driven Monolith

Intravos relies on a highly industrialized synchronization between the Frontend structure, Backend execution, and Database schema. The "Module Soup" has been destroyed in favor of strict **Domain-Driven Design (DDD)**.

## 1. The 5-Pillar Domains
Rather than organizing files by arbitrary types (e.g. `controllers/`, `services/`, `models/` globally), both the Frontend and Backend divide logic across identical macro-components:

1. **CRM**: Analytics, Customers, Leads, Referrals.
2. **Operations**: Bookings, Calendars, Tasks, Visas, Cancellations, Vouchers.
3. **Finance**: Invoices, Quotations, Expenses, Ledger.
4. **Marketplace**: Suppliers, Global Offers, Resource Directory.
5. **System**: Access Control (Auth), Trash, Core Settings, Uploads, Users.

### The Backend Structure (`backend/domains/`)
Each domain contains self-sufficient folders for its specific operations. This encapsulates routes, services, and local utilities so the global namespace isn't polluted by thousands of generic services. 

All external utilities are housed in `backend/providers/` (like PDF engines and Email API wrappers) or `backend/core/` for strict middleware and generic `errorHandlers`.

### The Frontend Structure (`frontend/src/features/`)
Relying heavily on **Feature-Sliced Design**. UI logic belonging specifically to the Finance system does not pollute `src/components/`. It goes definitively to `src/features/finance/components/`. Only universal design-system parts (like shadcn buttons) are allowed in `src/components/ui/`.

---

## 2. Infrastructure Routing & Security
Instead of 44 isolated express routers colliding on the backend, Intravos employs a **Master Hub Strategy**:
1. Global hooks are run in `routes/index.js` (e.g., `enforceSubscription`).
2. The request routes out to one of the 5 Domain Routers (`finance.routes.js`).
3. The Domain Router delegates to the strictly separated module router (`invoices.routes.js`).

### Permission Chains
Middleware injections run sequentially:
`authenticate` -> `requireStaff()` -> `requireFeature('module_name')`
This establishes 100% confidence that operations never leak.

---

## 3. The 7-Tier Database Strategy
The `60KB` final schema has been shattered and decoupled. 
Database configuration executes sequentially from Foundation -> Roles -> Modules -> RLS. 

**Compilation System:** The script `backend/scripts/compile-schema.js` automatically weaves the isolated `schema/XX-name.sql` files together for execution via Supabase without violating foreign-key constraints.
