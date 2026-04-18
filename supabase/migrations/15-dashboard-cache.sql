-- 15-dashboard-cache.sql
-- Sub-system for high-velocity executive metrics caching

CREATE TABLE IF NOT EXISTS dashboard_stats_cache (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    active_leads_count INTEGER DEFAULT 0,
    leads_today_count INTEGER DEFAULT 0,
    tasks_due_today_count INTEGER DEFAULT 0,
    active_bookings_count INTEGER DEFAULT 0,
    revenue_this_month DECIMAL(14,2) DEFAULT 0,
    collected_this_month DECIMAL(14,2) DEFAULT 0,
    outstanding_amount DECIMAL(14,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_tenant ON dashboard_stats_cache(tenant_id);

-- RLS
ALTER TABLE dashboard_stats_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_read_dashboard_cache ON dashboard_stats_cache
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Write policy for system/admin updates
CREATE POLICY tenant_all_dashboard_cache ON dashboard_stats_cache
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
