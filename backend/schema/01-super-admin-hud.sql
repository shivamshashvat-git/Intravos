-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 01 - Super Admin & Platform HUD
-- Isolation: Cross-Tenant Platform Data
-- ============================================================

-- Contains definition of Plans which are assigned to Tenants
CREATE TABLE IF NOT EXISTS plans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  price_monthly       NUMERIC NOT NULL DEFAULT 0,
  price_annual        NUMERIC NOT NULL DEFAULT 0,
  max_seats           INTEGER NOT NULL DEFAULT 1,
  storage_limit_mb    INTEGER NOT NULL DEFAULT 1024,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Super admin sales management
CREATE TABLE IF NOT EXISTS sales_inquiries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  organization        TEXT,
  source              TEXT DEFAULT 'organic',
  features_interested JSONB DEFAULT '[]',
  message             TEXT,
  status              TEXT DEFAULT 'new',
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing and potential client tracking
CREATE TABLE IF NOT EXISTS platform_prospects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  status              TEXT DEFAULT 'new',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform billing logic
CREATE TABLE IF NOT EXISTS platform_invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID, -- Will be linked in later file but left open here for flexibility
  invoice_number      TEXT,
  base_amount         DECIMAL(12,2),
  tax_amount          DECIMAL(12,2),
  total_amount        DECIMAL(12,2) NOT NULL,
  due_date            DATE,
  notes               TEXT,
  status              TEXT DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID, 
  amount              DECIMAL(12,2) NOT NULL,
  payment_date        DATE,
  payment_type        TEXT,
  payment_method      TEXT,
  transaction_ref     TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons & Discounts
CREATE TABLE IF NOT EXISTS coupons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT NOT NULL UNIQUE,
  discount_pct        INTEGER DEFAULT 0,
  valid_from          DATE,
  valid_to            DATE,
  is_active           BOOLEAN DEFAULT TRUE,
  max_uses            INTEGER,
  times_used          INTEGER DEFAULT 0,
  coupon_type         TEXT DEFAULT 'trial',
  metadata            JSONB DEFAULT '{}',
  created_by          UUID, -- Replaces references without strict enforced integrity out of order
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usage_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id           UUID REFERENCES coupons(id) ON DELETE CASCADE,
  tenant_id           UUID, 
  used_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform-wide configuration & Audit Trail
CREATE TABLE IF NOT EXISTS platform_settings (
  id                  TEXT PRIMARY KEY,
  settings            JSONB NOT NULL,
  updated_by          UUID, 
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_changelog (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID, 
  user_id             UUID, 
  action              changelog_action NOT NULL,
  title               TEXT,
  details             JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event               TEXT NOT NULL,
  details             JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  super_admin_user_id   UUID, 
  target_user_id        UUID, 
  target_tenant_id      UUID, 
  reason                TEXT,
  metadata              JSONB DEFAULT '{}',
  session_token         TEXT UNIQUE,
  status                TEXT DEFAULT 'active',
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ
);
