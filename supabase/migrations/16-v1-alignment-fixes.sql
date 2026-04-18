-- 16-v1-alignment-fixes.sql
-- Final alignment of CRM and Operations schemas for V1 Production Ready state

-- 1. Leads Table Pax & Financial Alignment
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pax_children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pax_infants INTEGER DEFAULT 0;

ALTER TABLE leads RENAME COLUMN final_price TO selling_price;
ALTER TABLE leads RENAME COLUMN vendor_cost TO cost_price;

-- 2. Lead Notes Enhancement
ALTER TABLE lead_notes
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- 3. Lead Communications Logic
-- Standardizing on lead_communications table (referenced by frontend)
CREATE TABLE IF NOT EXISTS lead_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comm_type TEXT NOT NULL,   -- 'call'|'whatsapp'|'email'|'sms'|'in_person'
    direction TEXT NOT NULL,  -- 'inbound'|'outbound'
    summary TEXT,
    duration_mins INTEGER,
    comm_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_comms_lead ON lead_communications(lead_id);

-- 4. Bookings Pax Expansion
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pax_adults INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pax_children INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pax_infants INTEGER DEFAULT 0;

-- 5. RLS Policies for New Tables
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_all_lead_comms ON lead_communications
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- 6. Dashboards Cache - Ensure consolidated and RLS exists
ALTER TABLE dashboard_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_read_dashboard_cache ON dashboard_stats_cache;
CREATE POLICY tenant_read_dashboard_cache ON dashboard_stats_cache
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- 7. Fix for v_trash_items (Referencing the regression report findings)
CREATE OR REPLACE VIEW v_trash_items WITH (security_invoker = on) AS
  SELECT 'leads'::TEXT AS table_name, 'Leads'::TEXT AS module_name, tenant_id, id AS item_id, customer_name AS item_label, deleted_at FROM leads WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'customers', 'Customers', tenant_id, id AS item_id, name, deleted_at FROM customers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'quotations', 'Quotations', tenant_id, id AS item_id, quote_number, deleted_at FROM quotations WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'invoices', 'Invoices', tenant_id, id AS item_id, invoice_number, deleted_at FROM invoices WHERE deleted_at IS NOT NULL;

-- 8. Unique constraint for Visa Docs (as specified in checklist)
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uni_visa_track_doc') THEN
      ALTER TABLE visa_documents ADD CONSTRAINT uni_visa_track_doc UNIQUE (visa_tracking_id, doc_type);
   END IF;
END $$;
