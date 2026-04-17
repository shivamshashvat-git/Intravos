-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 04 - Tenant Finances
-- Isolation: Bank Accounts, Quotations, Invoices, Payments
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_name            TEXT NOT NULL,
  bank_name               TEXT NOT NULL,
  acc_type                account_type NOT NULL DEFAULT 'current',
  running_balance         DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quotations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  quote_number            TEXT NOT NULL,
  
  -- Customer snapshot (denormalized for PDF generation)
  customer_name           TEXT,
  customer_phone          TEXT,
  customer_email          TEXT,
  customer_gstin          TEXT,
  destination             TEXT,
  start_date              DATE,
  end_date                DATE,
  guests                  INTEGER,
  rooms                   INTEGER,
  
  -- Financial
  status                  quotation_status NOT NULL DEFAULT 'draft',
  subtotal                DECIMAL(12,2) DEFAULT 0,
  gst_rate                DECIMAL(5,2) DEFAULT 5,
  gst_type                TEXT,
  cgst                    DECIMAL(12,2) DEFAULT 0,
  sgst                    DECIMAL(12,2) DEFAULT 0,
  igst                    DECIMAL(12,2) DEFAULT 0,
  total                   DECIMAL(12,2) DEFAULT 0,
  total_amount            DECIMAL(12,2) DEFAULT 0,
  total_vendor_cost       DECIMAL(12,2) DEFAULT 0,
  total_margin            DECIMAL(12,2) DEFAULT 0,
  
  -- Terms
  inclusions              TEXT,
  exclusions              TEXT,
  terms                   TEXT,
  valid_until             DATE,
  
  -- Versioning
  version                 INTEGER DEFAULT 1,
  parent_quote_id         UUID REFERENCES quotations(id) ON DELETE SET NULL,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id            UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_type               TEXT DEFAULT 'other',
  description             TEXT NOT NULL,
  sac_code                TEXT,
  quantity                INTEGER DEFAULT 1,
  unit_price              DECIMAL(12,2),
  amount                  DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price             DECIMAL(12,2),
  gst_rate                DECIMAL(5,2),
  gst_amount              DECIMAL(12,2) DEFAULT 0,
  vendor_cost             DECIMAL(12,2) DEFAULT 0,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoices (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  quotation_id            UUID REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number          TEXT NOT NULL,
  
  -- Customer snapshot
  customer_name           TEXT,
  customer_phone          TEXT,
  customer_email          TEXT,
  customer_gstin          TEXT,
  place_of_supply         TEXT,
  
  -- Agency snapshot
  agency_name             TEXT,
  agency_address          TEXT,
  agency_gstin            TEXT,
  agency_pan              TEXT,
  
  -- Financial
  status                  invoice_status NOT NULL DEFAULT 'draft',
  invoice_type            TEXT DEFAULT 'standard',
  financial_year          TEXT,
  subtotal                DECIMAL(12,2) DEFAULT 0,
  gst_type                TEXT,
  cgst                    DECIMAL(12,2) DEFAULT 0,
  sgst                    DECIMAL(12,2) DEFAULT 0,
  igst                    DECIMAL(12,2) DEFAULT 0,
  total                   DECIMAL(12,2) DEFAULT 0,
  amount_paid             DECIMAL(12,2) DEFAULT 0,
  due_date                DATE,
  
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id              UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description             TEXT NOT NULL,
  sac_code                TEXT,
  amount                  DECIMAL(12,2) NOT NULL,
  gst_rate                DECIMAL(5,2),
  cgst                    DECIMAL(12,2) DEFAULT 0,
  sgst                    DECIMAL(12,2) DEFAULT 0,
  igst                    DECIMAL(12,2) DEFAULT 0,
  total                   DECIMAL(12,2) DEFAULT 0,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount                  DECIMAL(12,2) NOT NULL,
  description             TEXT NOT NULL,
  expense_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS markup_presets (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  markup_pct              DECIMAL(5,2),
  markup_fixed            DECIMAL(12,2),
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Note: payment_transactions and vendor_ledger reference 'suppliers', 'bookings', 'booking_services'
-- so we'll build them here without FKs and add the FKs in Phase 05/06, or wait to create the tables in Phase 05.
-- Actually, it's safer to create them in Phase 06 after Operations and Marketplace are fully declared.
