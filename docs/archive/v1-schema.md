# Intravos V1 Master Schema (Ground Truth)

**Date**: 2026-04-18
**Version**: 1.0.0 (Consolidated)

## 1. Domain Group 01: Auth & Tenants

### `tenants`
Tracks agency accounts and branding.
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `slug` (TEXT, UNIQUE)
- `logo_url` (TEXT)
- `gstin` (TEXT) - Canonical GSTIN
- `pan` (TEXT)
- `agency_address` (TEXT)
- `agency_phone` (TEXT)
- `agency_email` (TEXT)
- `agency_website` (TEXT)
- `primary_color` (TEXT)
- `secondary_color` (TEXT)
- `invoice_prefix` (TEXT, Default: 'INV')
- `invoice_next_num` (INTEGER, Default: 1)
- `quote_prefix` (TEXT, Default: 'Q')
- `quote_next_num` (INTEGER, Default: 1)
- `plan` (TEXT, Default: 'starter')
- `subscription_status` (TEXT)
- `max_seats` (INTEGER, Default: 2)
- `features_enabled` (JSONB)
- **RLS**: Tenant isolated via `auth_tenant_id()`.

### `users`
Tracks personnel and access levels.
- `id` (UUID, PK)
- `tenant_id` (UUID, FK -> tenants)
- `auth_id` (UUID, UNIQUE)
- `email` (TEXT)
- `name` (TEXT)
- `role` (user_role: admin, staff, partner)
- `designation` (TEXT)
- `is_active` (BOOLEAN)
- `last_login_at` (TIMESTAMPTZ)

## 2. Domain Group 02: CRM (Leads & Engagement)

### `leads`
Standard sales tracking entity.
- `id` (UUID, PK)
- `tenant_id` (UUID, FK)
- `customer_id` (UUID, FK -> customers)
- `assigned_to` (UUID, FK -> users)
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `destination` (TEXT)
- `status` (lead_status)
- `priority` (lead_priority)
- `pax_adults` (INTEGER)
- `pax_children` (INTEGER)
- `pax_infants` (INTEGER)
- `selling_price` (DECIMAL) - Formerly final_price
- `cost_price` (DECIMAL) - Formerly vendor_cost
- `budget` (DECIMAL)
- `amount_collected` (DECIMAL)

### `lead_notes`
Internal notes for leads.
- `id` (UUID, PK)
- `lead_id` (UUID, FK)
- `content` (TEXT)
- `is_pinned` (BOOLEAN)

### `lead_communications`
Historical log of outbound/inbound touches.
- `comm_type` (TEXT: call, whatsapp, email)
- `direction` (TEXT: inbound, outbound)

## 3. Domain Group 03: Customers & Travelers

### `customers`
Master database of clients.
- `id` (UUID, PK)
- `name`, `phone`, `email`
- `passport_number`, `passport_expiry` (Masked in UI)
- `pan_number`, `gst_number`
- `preferences` (JSONB)

### `associated_travelers`
Dependents/Family members linked to a customer.
- `customer_id` (UUID, FK)
- `relationship` (TEXT)

## 4. Domain Group 04: Finance (Invoicing & Ledger)

### `quotations` / `quotation_items`
Detailed proposals.
- `quote_number` (TEXT, UNIQUE)
- `subtotal`, `gst_amount`, `discount`, `total`

### `invoices` / `invoice_items`
Legal billing documents.
- `invoice_number` (TEXT, UNIQUE)
- `amount_paid` (DECIMAL)

### `payment_transactions`
Individual payments linked to invoices.
- `amount`, `payment_method`, `bank_account_id`

## 5. Domain Group 05: Bookings

### `bookings`
Confirmed trip operations.
- `booking_ref` (TEXT)
- `pax_adults`, `pax_children`, `pax_infants`
- `total_selling_price`, `total_cost_price`
- `cancellation_reason`, `agency_cancellation_loss`

## 6. Domain Group 08: Tasks & Notifications

### `tasks`
Daily operation blockers.
- `is_done` (BOOLEAN)
- `status` (pending, in_progress, completed, cancelled)

### `notifications`
In-app alerts for users.
- `is_read` (BOOLEAN)

## 7. Domain Group 09: Settings & Analysis

### `bank_accounts`
Agency liquidity nodes.
- `running_balance` (DECIMAL)

### `dashboard_stats_cache`
Aggregated metrics for high-speed HUD load.
