# Intravos Master Reconciliation Matrix

This document maps every architectural vector in the system to verify alignment across the Database Schema, the Backend Services, and the Frontend UI.

## Module Matrix

| Module | Domain | Schema (migrations) | Backend (service + routes) | Frontend (pages + hooks) | Status | Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Leads** | CRM | `03-tenant-crm` | `crm/leads` | `LeadsPage`, `LeadDetailPage` | **LIVE** | CLEAN |
| **Customers** | CRM | `03-tenant-crm` | `crm/customers` | `CustomersPage`, `CustomerDetailPage` | **LIVE** | CLEAN |
| **Followups** | CRM | `03-tenant-crm` | `crm/followups` | Integrated in `LeadDetail` | **LIVE** | CLEAN |
| **Referrals** | CRM | *None specific* | `crm/referrals` | *None* | **LATENT** | NO_UI |
| **Feedback**| CRM | *None specific*| `crm/feedback` | *None* | **LATENT** | NO_UI |
| **Analytics (Health)** | CRM | `15-dashboard-cache` (partial) | `crm/analytics/clientHealth` | *None* | **LATENT** | NO_UI |
| **Quotations** | Finance | `04-tenant-finance` | `finance/quotations` | `QuotationsPage`, `QuoteBuilderPage` | **LIVE** | CLEAN |
| **Invoices** | Finance | `04-tenant-finance` | `finance/invoices` | `InvoicesPage`, `InvoiceBuilderPage` | **LIVE** | CLEAN |
| **Payments** | Finance | `09-payment-transactions`| `finance/payments` | `PaymentDrawer` | **LIVE** | CLEAN |
| **Vendor Ledger** | Finance | `05` / `16` | `finance/vendor-ledger` | *None* | **LATENT** | NO_UI |
| **Expenses** | Finance | *None specific* | `finance/expenses` | *None* | **LATENT** | NO_UI |
| **Markup Presets** | Finance | *None specific* | `finance/markup-presets` | *None* | **LATENT** | NO_UI |
| **Bookings** | Operations | `10`, `17-booking-hub-rpc`| `operations/bookings` | `BookingsPage`, `BookingDetailPage` | **LIVE** | CLEAN |
| **Visas** | Operations | `10`, `12-visa-system` | `operations/visa` | `VisaListPage`, `VisaDetailPage` | **LIVE** | CLEAN |
| **Itineraries** | Operations | `11-itineraries` | `operations/itineraries` | `ItinerariesPage`, `ItineraryBuilderPage` | **LIVE** | CLEAN |
| **Cancellations** | Operations | `05` | `operations/cancellations` | `CancellationModal` | **LIVE** | CLEAN |
| **Tasks** | Operations | `13-operations-tasks` | `operations/tasks` | `TasksPage`, `CreateTaskDrawer` | **LIVE** | CLEAN |
| **Group Bookings**| Operations | *None specific* | `operations/group-bookings`| *None* | **LATENT** | NO_UI |
| **Calendar** | Operations | *None specific* | `operations/calendar` | *None* | **LATENT** | NO_UI |
| **Vouchers** | Operations | `05` | `operations/vouchers` | *None* | **LATENT** | NO_UI |
| **Documents** | Operations | `05`, `12` | `operations/documents` | Upload logic integrated | **LIVE** | CLEAN |
| **Marketplace Feed**| Marketplace | `06-global-marketplace` | `marketplace/network` | `.gitkeep` | **LATENT** | NO_UI |
| **Market Offers** | Marketplace | `06-global-marketplace` | `marketplace/offers` | `.gitkeep` | **LATENT** | NO_UI |
| **Suppliers** | Marketplace | `06-global-marketplace` | `marketplace/suppliers` | `.gitkeep` | **LATENT** | NO_UI |
| **Global Directory**| Marketplace | `06-global-marketplace` | `marketplace/directory` | `.gitkeep` | **LATENT** | NO_UI |
| **Bank Accounts** | System | `14-bank-accounts` | `system/tenants` | `AddBankAccountDrawer` | **LIVE** | CLEAN |
| **Trash/Recycling** | System | `16-v1-alignment-fixes` | `system/trash` | *None* | **LATENT** | NO_UI |
| **Master Assets** | System | *None specific* | `system/master-assets` | *None* | **LATENT** | NO_UI |
| **Notifications** | System | `13-operations-tasks` | `system/notifications` | `NotificationBell.tsx` | **PARTIAL** | NEEDS_AUDIT (No full page) |
| **Support** | System | *None specific* | `system/support` | *None* | **LATENT** | NO_UI |
| **Auth & Members**| System | `02`, `07` | `system/auth`, `system/users`| `LoginPage`, `InviteMemberDrawer` | **LIVE** | CLEAN |
| **Public Views** | Public | *None* | `system/public` | `PublicItineraryPage` | **LIVE** | CLEAN |

---

## SECTION A — LIVE SURFACE
*(What a user can actually accomplish in the UI today)*

1. **Agent can create and manage Leads & Customers**, tracking conversion status and chronological contact histories.
2. **Agent can build an Itinerary**, assembling day-by-day modules including flights, hotels, and activities.
3. **Agent can build Financial Quotations and Invoices**, calculating margins, applying custom multi-tier GST logic (IGST/CGST/SGST), and managing discount structures.
4. **Agent can log incoming Payments** against invoices, tracking outstanding balances dynamically.
5. **Agent can generate Branded PDFs**, including standard invoices, quotations, and comprehensive "Travel Packs".
6. **Agent can manage Visa Compliance**, tracking passport custody states, uploading tracked documents, and updating approval/rejection statuses.
7. **Agent can process Booking Cancellations**, using an automated calculator to track agency net loss based on refunds to client vs. supplier.
8. **Admin can configure Tenant Settings**, adding bank accounts and inviting new staff members to the workspace.
9. **Agent can track Tasks**, assigning to-dos internally alongside basic notification bells.
10. **Agent can view Executive Dashboards**, showing high-level cash flow and operational metrics (cached via RPC).

---

## SECTION B — HIDDEN CAPABILITY
*(Fully built in the backend/schema, just waiting for a UI)*

1. **Global Marketplace Network (B2B Feed)**: Requires a social-feed UI (like LinkedIn) for agents to post offers, like/comment, and rate supplier quality.
2. **Vendor Ledger & Supplier Management**: Requires a financial UI to reconcile "Agency-to-Vendor" outbound payments and track outstanding supplier balances.
3. **Trash & Recovery (Recycle Bin)**: Requires a system interface mapping to the `v_trash_items` view so admins can restore accidentally soft-deleted records.
4. **Group Bookings**: Requires a batch-processing UI to group multiple independent customers into a single master booking.
5. **Markup Presets**: Requires an admin settings panel to manage and deploy predefined commission models.
6. **Sudo Mode Authorization**: Requires a global frontend interceptor and modal to catch `403 Sudo Required` errors and prompt the user for their password before executing sensitive mutations.
7. **Client Health Analytics**: Requires the Super Admin HUD to render the Red/Yellow/Green health matrices logic (from `clientHealth.js`).

---

## SECTION C — GAPS AND RISKS

1. **The Sudo Trap**: The backend strictly enforces `sudo.js` for certain actions. Because the frontend lacks the interception modal to handle this, any current attempt to execute a sudo-protected route from the React app will result in a hard 403 failure with no recovery path.
2. **The "Monkey-Patch" Collision**: Both `financialBlinder.js` and `cacheMiddleware.js` hijack the Express `res.json()` function at runtime. Modifying core prototype functions concurrently is architecturally brittle; altering their middleware sequence could unpredictably serialize or bypass data scrubbing.
3. **Puppeteer OOM Vulnerability**: Generating multi-page PDFs locally in the Express thread via `pdfEngine.js` will cause massive RAM spikes. Concurrent requests from multiple users will likely trigger Out Of Memory (OOM) crashes, taking the entire API offline.
4. **Testing Deficit**: Running `jest --passWithNoTests` indicates 0 automated coverage. Given the complexity of the GST/IGST calculations and margin blinders, relying strictly on manual testing introduces extreme regression risk.
5. **Notification Black Hole**: IvoBot generates rich database notifications (stale leads, mismatches) but the UI only has a minimal `NotificationBell`. Users will struggle to manage, clear, or action hundreds of notifications without a dedicated "Inbox" view.

---

## ROADMAP

### V1 BOUNDARY (Definitively Complete)
The "Holy Trinity" is fully operational: **CRM (Lead routing), Finance (Invoicing & Margins), and Operations (Visas, Bookings, Itineraries).** Multi-tenant isolation and the core document rendering engine are stable.

### V1.1 CANDIDATES (Strategic Low-Effort / High-Impact)
1. **Sudo Interceptor UI**: Essential to prevent broken user experiences when hitting secure endpoints.
2. **PDF Queue Worker**: Essential to prevent production server crashes. Offload Puppeteer.
3. **Trash Recovery UI**: Maps directly to the existing `v_trash_items` view; highly requested enterprise feature.
4. **Vendor Ledger UI**: Closes the accounting loop (you can track incoming money, but you currently lack the UI to track outgoing supplier payments).

### V2 SCOPE (Future Expansion)
1. **The Global Marketplace**: Turning the SaaS into a B2B network. Let agents buy/sell inventory.
2. **IvoBot External Triggers**: Connect the bot engine to WhatsApp/SMS APIs for automated customer alerts.
3. **Group Bookings**: Complex UI for massive booking management.
