-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 07 - Utilities & Security Isolation
-- Isolation: Caching, Global Views, Row Level Security
-- ============================================================

-- 1. UTILITIES & CACHING
CREATE TABLE IF NOT EXISTS dashboard_stats_cache (
  tenant_id               UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  total_revenue           DECIMAL(14,2) DEFAULT 0,
  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_health_cache (
  customer_id             UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  health_score            NUMERIC(5,2) DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_health (
  tenant_id               UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  health                  TEXT NOT NULL DEFAULT 'red',
  last_login              TIMESTAMPTZ,
  leads_this_week         INTEGER DEFAULT 0,
  actions_this_week       INTEGER DEFAULT 0,
  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription            JSONB NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type             TEXT NOT NULL,
  rows_count              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. UNIVERSAL VIEWS
CREATE OR REPLACE VIEW v_trash_items WITH (security_invoker = on) AS
  SELECT 'leads'::TEXT AS table_name, tenant_id, id, customer_name AS label, deleted_at FROM leads WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'customers', tenant_id, id, name, deleted_at FROM customers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'quotations', tenant_id, id, quote_number, deleted_at FROM quotations WHERE deleted_at IS NOT NULL;

-- 3. ROW LEVEL SECURITY (RLS) LOGIC

CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin';
$$ LANGUAGE sql STABLE;

-- Apply Universal RLS (Step 1: Super Admin Access)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS sa_all ON %I', tbl);
    EXECUTE format('CREATE POLICY sa_all ON %I FOR ALL USING (is_super_admin())', tbl);
  END LOOP;
END;
$$;

-- Apply Tenant Isolation (Step 2: Scoped Access)
-- This strictly prevents the tenant_id logic from applying to Super Admin Platform Tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename NOT IN ('plans', 'tenants', 'sales_inquiries', 'platform_settings', 'platform_changelog', 'platform_invoices', 'platform_payments', 'platform_prospects', 'announcements', 'coupons', 'dashboard_stats_cache')
  LOOP
    PERFORM 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'tenant_id';
    IF FOUND THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_access ON %I', tbl);
      EXECUTE format('CREATE POLICY tenant_access ON %I FOR ALL USING (tenant_id::text = auth_tenant_id())', tbl);
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
