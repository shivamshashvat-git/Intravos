-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 02 - Tenant Foundations
-- Isolation: Tenant Account, Users, Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL UNIQUE,
  logo_url                  TEXT,
  plan                      TEXT NOT NULL DEFAULT 'starter',
  
  -- Subscription lifecycle
  subscription_status       TEXT NOT NULL DEFAULT 'trial',
  subscription_start_date   TIMESTAMPTZ,
  subscription_end_date     TIMESTAMPTZ,
  trial_end                 DATE DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
  is_free                   BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_client           BOOLEAN NOT NULL DEFAULT FALSE,
  grace_until               TIMESTAMPTZ,
  limited_until             TIMESTAMPTZ,
  deactivated_at            TIMESTAMPTZ,
  annual_price              DECIMAL(12,2),
  current_health_score      TEXT,
  
  -- Feature gating
  features_enabled          JSONB NOT NULL DEFAULT '[]',
  
  -- Agency profile
  agency_address            TEXT,
  agency_phone              TEXT,
  agency_email              TEXT,
  agency_gstin              TEXT,
  bank_details              JSONB DEFAULT '{}',
  
  -- Quota enforcement
  max_seats                 INTEGER DEFAULT 2,
  storage_limit_mb          INTEGER DEFAULT 5120,
  storage_used_mb           INTEGER DEFAULT 0,
  
  -- Referral system
  referral_code             TEXT UNIQUE,
  payout_bank_details       JSONB,
  
  -- Invoice/Quote settings
  invoice_prefix            TEXT,
  invoice_next_num          INTEGER DEFAULT 1,
  invoice_bank_text         TEXT,
  quote_prefix              TEXT,
  quote_next_num            INTEGER DEFAULT 1,
  quote_validity            INTEGER DEFAULT 7,
  quote_terms               TEXT,
  quote_inclusions          TEXT,
  quote_exclusions          TEXT,
  gstin                     TEXT,
  pan                       TEXT,
  gst_number                TEXT,
  primary_color             TEXT,
  secondary_color           TEXT,
  agency_website            TEXT,
  health_score              INTEGER,
  
  -- State
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id                 UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key                       TEXT NOT NULL,
  value                     JSONB NOT NULL,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_id                   UUID UNIQUE NOT NULL,
  email                     TEXT NOT NULL,
  name                      TEXT NOT NULL,
  phone                     TEXT,
  role                      user_role NOT NULL DEFAULT 'staff',
  avatar_url                TEXT,
  designation               TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at             TIMESTAMPTZ,
  
  -- Personalization
  tips_seen                 JSONB DEFAULT '[]',
  milestones                JSONB DEFAULT '[]',
  notif_prefs               JSONB DEFAULT '{}',
  
  -- Feature overrides
  features_override         JSONB,
  network_access            BOOLEAN DEFAULT FALSE,
  metadata                  JSONB DEFAULT '{}',
  
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attach FKs retroactively to Super Admin data that needed Tenants & Users
ALTER TABLE platform_invoices ADD CONSTRAINT fk_pi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE platform_payments ADD CONSTRAINT fk_pp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE coupons ADD CONSTRAINT fk_c_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE coupon_usage_logs ADD CONSTRAINT fk_cul_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE platform_settings ADD CONSTRAINT fk_ps_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE platform_changelog ADD CONSTRAINT fk_pcl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE platform_changelog ADD CONSTRAINT fk_pcl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_sa FOREIGN KEY (super_admin_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_tu FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_tt FOREIGN KEY (target_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Global/Tenant Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                     TEXT NOT NULL,
  message                   TEXT NOT NULL,
  target_role               user_role,
  announcement_type         TEXT DEFAULT 'feature',
  is_active                 BOOLEAN DEFAULT TRUE,
  ends_at                   TIMESTAMPTZ,
  created_by                UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id           UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id                   UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
