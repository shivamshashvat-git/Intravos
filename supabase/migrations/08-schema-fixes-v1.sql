-- ============================================================
-- INTRAVOS MIGRATION
-- Phase: 08 - Schema Fixes V1
-- Targeted: Lead Status Alignment, GSTIN Consolidation, Dashboard Cache Expansion
-- ============================================================

BEGIN;

-- ── FIX 1: LEAD_STATUS ENUM CONFLICT (CRITICAL) ──
-- Aligning enum values with the actual travel sales pipeline logic.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status' AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = pg_type.oid AND enumlabel = 'contacted')) THEN
        ALTER TYPE lead_status RENAME TO lead_status_old;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM (
          'new', 
          'contacted', 
          'quote_sent', 
          'negotiating', 
          'converted', 
          'lost', 
          'on_hold'
        );
    END IF;
END $$;

ALTER TABLE leads ALTER COLUMN status TYPE lead_status USING (
  CASE 
    WHEN status::text = 'qualified' THEN 'contacted'::lead_status
    WHEN status::text = 'quoted' THEN 'quote_sent'::lead_status
    WHEN status::text = 'booked' THEN 'converted'::lead_status
    WHEN status::text = 'completed' THEN 'converted'::lead_status
    WHEN status::text = 'cancelled' THEN 'lost'::lead_status
    -- Preserve existing values if they already match new set
    WHEN status::text IN ('new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold') THEN status::text::lead_status
    ELSE 'new'::lead_status
  END
);

DROP TYPE IF EXISTS lead_status_old;


-- ── FIX 2: DUPLICATE GSTIN COLUMNS ON TENANTS (DATA INTEGRITY) ──
-- Consolidating agency_gstin and gst_number into the canonical gstin column.

UPDATE tenants SET gstin = COALESCE(gstin, agency_gstin, gst_number);

ALTER TABLE tenants DROP COLUMN IF EXISTS agency_gstin;
ALTER TABLE tenants DROP COLUMN IF EXISTS gst_number;

COMMENT ON COLUMN tenants.gstin IS 'Single canonical column for agency GSTIN';


-- ── FIX 3: EXPAND DASHBOARD_STATS_CACHE (PERFORMANCE PREP) ──
-- Adding tracking columns for the V1 Dashboard HUD.

ALTER TABLE dashboard_stats_cache 
  ADD COLUMN IF NOT EXISTS active_leads_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_today_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tasks_due_today_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_bookings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_this_month DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collected_this_month DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMIT;

-- Schema is now V1-ready. Proceed to frontend build.
