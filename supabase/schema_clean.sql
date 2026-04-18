BEGIN;


-- 1. EXTENSIONS

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- 2. ENUMS

DO $$ 
BEGIN 
  CREATE TYPE itinerary_item_type AS ENUM ('hotel', 'flight', 'activity', 'transfer', 'note', 'meal', 'internal_note', 'insurance', 'lounge', 'sim_card', 'forex'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'quoted', 'booked', 'completed', 'cancelled'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
        CREATE TYPE refund_status AS ENUM (
            'not_applicable', 'pending', 'partial', 'full', 'none'
        );
    END IF;
END $$;

DO $$
BEGIN
    -- Profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_address') THEN
        ALTER TABLE tenants ADD COLUMN agency_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_phone') THEN
        ALTER TABLE tenants ADD COLUMN agency_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_email') THEN
        ALTER TABLE tenants ADD COLUMN agency_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='gstin') THEN
        ALTER TABLE tenants ADD COLUMN gstin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='pan') THEN
        ALTER TABLE tenants ADD COLUMN pan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_website') THEN
        ALTER TABLE tenants ADD COLUMN agency_website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='primary_color') THEN
        ALTER TABLE tenants ADD COLUMN primary_color TEXT;
    END IF;
    
    -- Invoicing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_prefix') THEN
        ALTER TABLE tenants ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_next_num') THEN
        ALTER TABLE tenants ADD COLUMN invoice_next_num INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_bank_text') THEN
        ALTER TABLE tenants ADD COLUMN invoice_bank_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_prefix') THEN
        ALTER TABLE tenants ADD COLUMN quote_prefix TEXT DEFAULT 'Q';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_validity') THEN
        ALTER TABLE tenants ADD COLUMN quote_validity INTEGER DEFAULT 7;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_terms') THEN
        ALTER TABLE tenants ADD COLUMN quote_terms TEXT;
    END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE comm_type AS ENUM ('call', 'whatsapp', 'email', 'sms', 'in_person'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_priority AS ENUM ('low', 'normal', 'high', 'urgent'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

DO $$ 
BEGIN 
  CREATE TYPE changelog_action AS ENUM ('tenant_created', 'tenant_activated', 'tenant_paused', 'tenant_plan_changed', 'trial_started', 'trial_extended', 'trial_expired', 'trial_converted', 'payment_received_platform', 'feature_toggled', 'feature_locked', 'feature_unlocked', 'user_created', 'user_deactivated', 'settings_changed', 'ticket_created', 'ticket_resolved', 'announcement_created', 'maintenance_scheduled', 'subscription_activated', 'subscription_renewed', 'subscription_grace', 'subscription_limited', 'subscription_suspended', 'free_access_granted', 'free_access_expired', 'upgrade_requested', 'upgrade_approved', 'upgrade_rejected', 'pricing_changed', 'customer_merged', 'impersonation_started', 'impersonation_ended'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visa_status') THEN
        CREATE TYPE visa_status AS ENUM (
            'not_started', 'docs_collecting', 'docs_collected', 'applied', 'in_process', 'approved', 'rejected'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_status') THEN
        CREATE TYPE doc_status AS ENUM (
            'pending', 'uploaded', 'verified', 'not_needed'
        );
    END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM (
            'upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'
        );
    END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'rewarded', 'expired'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE doc_status AS ENUM ('pending', 'uploaded', 'verified', 'not_needed'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
  CREATE TYPE passport_holder AS ENUM ('customer', 'agency', 'vfs', 'embassy', 'returned'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM (
            'confirmed', 'in_progress', 'completed', 'cancelled'
        );
    END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE notification_type AS ENUM ('lead_assigned', 'lead_status_changed', 'note_added', 'followup_due', 'followup_overdue', 'engagement_birthday', 'engagement_anniversary', 'engagement_dormant', 'engagement_post_trip', 'task_assigned', 'task_due', 'payment_pending', 'payment_received', 'payment_overdue', 'trial_expiring', 'trial_expired', 'announcement', 'system'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE visa_status AS ENUM ('not_started', 'docs_collecting', 'docs_collected', 'applied', 'in_process', 'approved', 'rejected'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uni_visa_track_doc') THEN
      ALTER TABLE visa_documents ADD CONSTRAINT uni_visa_track_doc UNIQUE (visa_tracking_id, doc_type);
   END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE ticket_type AS ENUM ('support', 'bug', 'feature_request'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itinerary_item_type') THEN
        CREATE TYPE itinerary_item_type AS ENUM (
            'hotel', 'flight', 'activity', 'transfer', 'note', 'meal',
            'internal_note', 'insurance', 'lounge', 'sim_card', 'forex'
        );
    END IF;
END $$;

DO $$ 
BEGIN 
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'partner'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. TABLES (Structure Only)

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

CREATE TABLE IF NOT EXISTS users (

  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL,
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

CREATE TABLE IF NOT EXISTS customers (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  phone                   TEXT,
  alt_phone               TEXT,
  email                   TEXT,
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  pincode                 TEXT,
  country                 TEXT DEFAULT 'India',
  
  -- Personal profiling
  date_of_birth           DATE,
  wedding_anniversary     DATE,
  gender                  TEXT,
  
  -- Travel preferences
  preferred_destinations  TEXT,
  preferred_airlines      TEXT,
  preferred_hotel_class   TEXT,
  dietary_preferences     TEXT,
  special_needs           TEXT,
  
  -- Identity & compliance
  passport_number         TEXT,
  passport_expiry         DATE,
  pan_number              TEXT,
  gst_number              TEXT,
  aadhar_number           TEXT,
  
  -- Business metrics
  lifetime_value          DECIMAL(12,2) DEFAULT 0,
  total_bookings          INTEGER DEFAULT 0,
  total_spent             DECIMAL(12,2) DEFAULT 0,
  last_booking_at         TIMESTAMPTZ,
  last_contacted_at       TIMESTAMPTZ,
  
  -- Segmentation
  customer_type           TEXT DEFAULT 'individual',
  tags                    TEXT[] DEFAULT '{}',
  lead_source             TEXT,
  referred_by             UUID,
  
  -- Flexible storage
  important_dates         JSONB DEFAULT '[]',
  passport_details        JSONB,
  preferences             JSONB DEFAULT '{}',
  consent_profile         JSONB DEFAULT '{}',
  metadata                JSONB DEFAULT '{}',
  notes                   TEXT,
  
  -- System
  is_archived             BOOLEAN DEFAULT FALSE,
  bookings_count          INTEGER DEFAULT 0,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS leads (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  customer_id             UUID,
  assigned_to             UUID,
  
  customer_name           TEXT NOT NULL,
  customer_phone          TEXT NOT NULL,
  customer_email          TEXT,
  destination             TEXT,
  hotel_name              TEXT,
  location                TEXT,
  checkin_date            DATE,
  checkout_date           DATE,
  travel_start_date       DATE,
  guests                  INTEGER DEFAULT 1,
  rooms                   INTEGER DEFAULT 1,
  pax_adults              INTEGER DEFAULT 1,
  price_seen              DECIMAL(12,2),
  
  source                  lead_source NOT NULL DEFAULT 'manual',
  status                  lead_status NOT NULL DEFAULT 'new',
  priority                lead_priority NOT NULL DEFAULT 'normal',
  
  budget                  DECIMAL(12,2) DEFAULT 0,
  final_price             DECIMAL(12,2) DEFAULT 0,
  vendor_cost             DECIMAL(12,2) DEFAULT 0,
  profit                  DECIMAL(12,2) DEFAULT 0,
  margin                  DECIMAL(12,2) DEFAULT 0,
  amount_collected        DECIMAL(12,2) DEFAULT 0,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS bookings (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID,
    invoice_id UUID,
    quotation_id UUID,
    booking_ref TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    destination TEXT,
    travel_start_date DATE,
    travel_end_date DATE,
    traveler_count INTEGER DEFAULT 1,
    total_cost DECIMAL(12,2) DEFAULT 0,
    total_selling_price DECIMAL(12,2) DEFAULT 0,
    amount_collected DECIMAL(12,2) DEFAULT 0,
    special_requests TEXT,
    internal_notes TEXT,
    status booking_status DEFAULT 'confirmed',
    
    -- Cancellation tracking
    cancellation_reason TEXT,
    cancellation_notes TEXT,
    cancellation_date DATE,
    refund_status refund_status DEFAULT 'not_applicable',
    refund_due_to_client DECIMAL(12,2) DEFAULT 0,
    supplier_refund_due DECIMAL(12,2) DEFAULT 0,
    supplier_refund_received DECIMAL(12,2) DEFAULT 0,
    agency_cancellation_loss DECIMAL(12,2) DEFAULT 0,

    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS itineraries (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID,
    title TEXT NOT NULL,
    destination TEXT,
    share_token TEXT UNIQUE,
    is_shared BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    template_name TEXT,
    option_label TEXT,
    option_group TEXT,
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS itinerary_items (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID NOT NULL,
    item_type itinerary_item_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_val TEXT,
    sort_order INTEGER DEFAULT 0,
    media_urls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS quotations (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  customer_id             UUID,
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
  parent_quote_id         UUID,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS quotation_items (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id            UUID NOT NULL,
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
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  quotation_id            UUID,
  customer_id             UUID,
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
  
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS invoice_items (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id              UUID NOT NULL,
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

CREATE TABLE IF NOT EXISTS bank_accounts (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    acc_type account_type NOT NULL DEFAULT 'current',
    running_balance DECIMAL(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS tasks (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assigned_to UUID,
    lead_id UUID,
    booking_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    is_done BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS announcements (

  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                     TEXT NOT NULL,
  message                   TEXT NOT NULL,
  target_role               user_role,
  announcement_type         TEXT DEFAULT 'feature',
  is_active                 BOOLEAN DEFAULT TRUE,
  ends_at                   TIMESTAMPTZ,
  created_by                UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS announcement_dismissals (

  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id           UUID,
  user_id                   UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()

);

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

CREATE TABLE IF NOT EXISTS platform_prospects (

  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT,
  status              TEXT DEFAULT 'new',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()

);

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
  coupon_id           UUID,
  tenant_id           UUID, 
  used_at             TIMESTAMPTZ NOT NULL DEFAULT now()

);

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

CREATE TABLE IF NOT EXISTS tenant_settings (

  tenant_id                 UUID,
  key                       TEXT NOT NULL,
  value                     JSONB NOT NULL,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)

);

CREATE TABLE IF NOT EXISTS customer_merge_logs (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  primary_id              UUID,
  merged_ids              UUID[] NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS associated_travelers (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  customer_id             UUID NOT NULL,
  name                    TEXT NOT NULL,
  relationship            TEXT,
  phone                   TEXT,
  email                   TEXT,
  date_of_birth           DATE,
  gender                  TEXT,
  passport_number         TEXT,
  passport_expiry         DATE,
  passport_country        TEXT,
  nationality             TEXT DEFAULT 'Indian',
  dietary_preferences     TEXT,
  special_needs           TEXT,
  frequent_flyer          TEXT,
  notes                   TEXT,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS lead_notes (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID,
  lead_id                 UUID,
  entity_type             TEXT,
  entity_id               UUID,
  user_id                 UUID NOT NULL,
  note                    TEXT,
  content                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS lead_followups (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID NOT NULL,
  user_id                 UUID,
  due_date                TIMESTAMPTZ NOT NULL,
  note                    TEXT,
  is_done                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS lead_attachments (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL,
  file_url                TEXT NOT NULL,
  file_name               TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS lead_documents (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL,
  doc_type                TEXT NOT NULL,
  file_url                TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS activity_logs (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  user_id                 UUID,
  lead_id                 UUID,
  entity_type             TEXT,
  entity_id               UUID,
  action                  TEXT NOT NULL,
  field                   TEXT,
  old_value               TEXT,
  new_value               TEXT,
  changes                 JSONB DEFAULT '{}',
  details                 JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS referrals (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_tenant_id      UUID NOT NULL,
  referee_tenant_id       UUID,
  status                  referral_status DEFAULT 'pending',
  admin_notes             TEXT,
  fulfilled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS message_templates (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  content                 TEXT NOT NULL,
  template_text           TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS engagement_log (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  customer_id             UUID,
  user_id                 UUID,
  event_type              TEXT NOT NULL,
  engagement_type         TEXT,
  channel                 TEXT,
  template_id             UUID,
  message_sent            TEXT,
  meta                    JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS notifications (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notif_type TEXT NOT NULL, -- 'task_assigned'|'task_due'|'lead_assigned'|'payment_received'|'followup_due'|'trial_expiring'
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    lead_id UUID,
    booking_id UUID,
    task_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS calendar_events (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  user_id                 UUID,
  title                   TEXT NOT NULL,
  event_type              TEXT,
  event_date              DATE NOT NULL,
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS expense_categories (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS expenses (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  description             TEXT NOT NULL,
  expense_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS markup_presets (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  markup_pct              DECIMAL(5,2),
  markup_fixed            DECIMAL(12,2),
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS itinerary_days (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL,
    day_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS group_booking_members (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    member_name TEXT NOT NULL,
    room_sharing TEXT,
    add_ons JSONB DEFAULT '[]',
    base_cost DECIMAL(12,2) DEFAULT 0,
    room_upgrade DECIMAL(12,2) DEFAULT 0,
    add_on_total DECIMAL(12,2) DEFAULT 0,
    per_person_total DECIMAL(12,2) DEFAULT 0,
    invoice_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS visa_tracking (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID,
    traveler_name TEXT NOT NULL,
    applicant_name TEXT,
    destination TEXT,
    visa_type TEXT DEFAULT 'tourist',
    passport_number TEXT,
    passport_holder TEXT DEFAULT 'customer', -- 'customer'|'agency'|'vfs'|'embassy'|'returned'
    passport_expiry DATE,
    fee_paid_by TEXT DEFAULT 'customer',
    visa_fee DECIMAL(12,2) DEFAULT 0,
    service_charge DECIMAL(12,2) DEFAULT 0,
    appointment_date DATE,
    submission_date DATE,
    expected_date DATE,
    approved_date DATE,
    rejection_reason TEXT,
    vfs_reference TEXT,
    embassy_reference TEXT,
    notes TEXT,
    assigned_to UUID,
    status visa_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS visa_documents (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visa_tracking_id UUID NOT NULL,
    doc_type TEXT NOT NULL,
    file_url TEXT,
    storage_bucket TEXT,
    storage_path TEXT,
    status doc_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(visa_tracking_id, doc_type)

);

CREATE TABLE IF NOT EXISTS travel_insurance_policies (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  customer_id             UUID,
  booking_id              UUID,
  policy_number           TEXT NOT NULL,
  provider                TEXT,
  coverage_type           TEXT DEFAULT 'basic',
  claim_status            TEXT DEFAULT 'none',
  start_date              DATE,
  end_date                DATE,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS documents (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  customer_id             UUID,
  booking_id              UUID,
  lead_id                 UUID,
  file_name               TEXT NOT NULL,
  file_url                TEXT NOT NULL,
  traveler_name           TEXT,
  category                TEXT DEFAULT 'other',
  storage_bucket          TEXT,
  storage_path            TEXT,
  file_size_bytes         BIGINT,
  mime_type               TEXT,
  included_in_travel_pack BOOLEAN DEFAULT FALSE,
  secure_link             TEXT,
  secure_link_expires_at  TIMESTAMPTZ,
  uploaded_by             UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS master_assets (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  asset_type              TEXT,
  title                   TEXT NOT NULL,
  description             TEXT,
  content                 JSONB,
  tags                    JSONB DEFAULT '[]',
  is_global               BOOLEAN DEFAULT FALSE,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS resource_hub_links (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID,
  title                   TEXT NOT NULL,
  url                     TEXT NOT NULL,
  category                TEXT,
  provider                TEXT,
  preview_mode            TEXT DEFAULT 'iframe',
  is_system               BOOLEAN DEFAULT FALSE,
  is_active               BOOLEAN DEFAULT TRUE,
  sort_order              INTEGER DEFAULT 0,
  usage_count             INTEGER DEFAULT 0,
  metadata                JSONB DEFAULT '{}',
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS support_tickets (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  user_id                 UUID,
  subject                 TEXT NOT NULL,
  description             TEXT,
  ticket_type             ticket_type DEFAULT 'support',
  status                  ticket_status DEFAULT 'open',
  screenshot_url          TEXT,
  browser_info            TEXT,
  page_url                TEXT,
  resolution              TEXT,
  resolved_by             UUID,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS ticket_replies (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id               UUID NOT NULL,
  user_id                 UUID,
  message                 TEXT NOT NULL,
  is_admin                BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS post_trip_feedback (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  booking_id              UUID,
  customer_id             UUID,
  destination_snapshot    TEXT,
  request_status          TEXT DEFAULT 'pending',
  requested_at            TIMESTAMPTZ,
  sent_at                 TIMESTAMPTZ,
  submitted_at            TIMESTAMPTZ,
  overall_rating          INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  hotel_rating            INTEGER CHECK (hotel_rating BETWEEN 1 AND 5),
  activity_rating         INTEGER CHECK (activity_rating BETWEEN 1 AND 5),
  transfer_rating         INTEGER CHECK (transfer_rating BETWEEN 1 AND 5),
  guide_rating            INTEGER CHECK (guide_rating BETWEEN 1 AND 5),
  what_went_well          TEXT,
  what_could_improve      TEXT,
  would_recommend         BOOLEAN,
  testimonial_consent     BOOLEAN DEFAULT FALSE,
  testimonial_text        TEXT,
  feedback_token          TEXT UNIQUE,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS suppliers (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  alt_phone               TEXT,
  contact_person          TEXT,
  designation             TEXT,
  supplier_type           TEXT,
  
  -- Address
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  country                 TEXT DEFAULT 'India',
  pincode                 TEXT,
  
  -- Compliance
  gst_number              TEXT,
  pan_number              TEXT,
  
  -- Banking
  bank_name               TEXT,
  bank_account_no         TEXT,
  bank_ifsc               TEXT,
  bank_branch             TEXT,
  upi_id                  TEXT,
  
  -- Business
  payment_terms           TEXT DEFAULT 'net_30',
  credit_limit            DECIMAL(12,2) DEFAULT 0,
  currency                TEXT DEFAULT 'INR',
  commission_rate         DECIMAL(5,2) DEFAULT 0,
  specialization          TEXT,
  destinations_served     TEXT,
  rating                  DECIMAL(3,2) DEFAULT 0,
  
  -- Flexible
  website                 TEXT,
  notes                   TEXT,
  tags                    TEXT[] DEFAULT '{}',
  metadata                JSONB DEFAULT '{}',
  
  -- System
  is_active               BOOLEAN DEFAULT TRUE,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS vendor_rate_cards (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  vendor_id               UUID NOT NULL,
  title                   TEXT,
  service_type            TEXT,
  file_url                TEXT,
  storage_bucket          TEXT,
  storage_path            TEXT,
  rate_details            JSONB DEFAULT '{}',
  season                  TEXT,
  destination             TEXT,
  valid_from              DATE,
  valid_until             DATE,
  uploaded_by             UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS agents_directory (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  agency_name             TEXT,
  contact_type            TEXT,
  email                   TEXT,
  phone                   TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  outstanding_payables    DECIMAL(12,2) DEFAULT 0,
  total_business_value    DECIMAL(12,2) DEFAULT 0,
  commission_earned       DECIMAL(12,2) DEFAULT 0,
  next_payment_due_at     DATE,
  payment_terms           TEXT,
  preferred_channel       TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS network_members (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL,
  tenant_id               UUID NOT NULL,
  company_name            TEXT,
  bio                     TEXT,
  specializations         TEXT[],
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS network_feed_posts (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id               UUID NOT NULL,
  tenant_id               UUID NOT NULL,
  post_type               TEXT NOT NULL DEFAULT 'update',
  content                 TEXT NOT NULL,
  media_urls              JSONB DEFAULT '[]',
  destination_tags        TEXT[],
  visibility              TEXT DEFAULT 'network',
  likes_count             INTEGER DEFAULT 0,
  comments_count          INTEGER DEFAULT 0,
  quality_disabled        BOOLEAN DEFAULT FALSE,
  quality_score           NUMERIC(3,2) DEFAULT 0,
  quality_votes           INTEGER DEFAULT 0,
  moderation_status       TEXT DEFAULT 'clear',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS network_feed_comments (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID NOT NULL,
  member_id               UUID NOT NULL,
  comment_text            TEXT NOT NULL,
  parent_comment_id       UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS network_feed_reactions (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID NOT NULL,
  member_id               UUID NOT NULL,
  reaction_type           TEXT DEFAULT 'like',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, member_id)

);

CREATE TABLE IF NOT EXISTS network_opportunities (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by               UUID,
  tenant_id               UUID NOT NULL,
  type                    TEXT DEFAULT 'requirement',
  title                   TEXT NOT NULL,
  description             TEXT,
  destination             TEXT,
  budget                  DECIMAL(12,2),
  urgency                 TEXT,
  status                  TEXT DEFAULT 'open',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS network_connections (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_member_id     UUID NOT NULL,
  target_member_id        UUID,
  requester_tenant_id     UUID,
  invite_email            TEXT,
  invite_name             TEXT,
  connected_at            TIMESTAMPTZ,
  note                    TEXT,
  is_demo_invite          BOOLEAN DEFAULT FALSE,
  status                  TEXT NOT NULL DEFAULT 'accepted',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS network_messages (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id               UUID,
  receiver_id             UUID,
  message                 TEXT NOT NULL,
  is_read                 BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS network_post_quality_ratings (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID,
  rater_member_id         UUID NOT NULL,
  rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, rater_member_id)

);

CREATE TABLE IF NOT EXISTS workspace_messages (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  sender_id               UUID,
  message                 TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS offers (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  destination             TEXT,
  image_url               TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS booking_services (

  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID NOT NULL,
  tenant_id                 UUID NOT NULL,
  supplier_id               UUID,
  service_type              itinerary_item_type NOT NULL,
  title                     TEXT NOT NULL,
  service_title             TEXT,
  confirmation_number       TEXT,
  service_start_date        DATE,
  service_end_date          DATE,
  room_type                 TEXT,
  meal_plan                 TEXT,
  special_requests          TEXT,
  cost                      DECIMAL(12,2) DEFAULT 0,
  cost_to_agency            DECIMAL(12,2) DEFAULT 0,
  price_to_client           DECIMAL(12,2) DEFAULT 0,
  paid_to_supplier_amount   DECIMAL(12,2) DEFAULT 0,
  supplier_payment_status   TEXT DEFAULT 'unpaid',
  payable_due_date          DATE,
  commission_amount         DECIMAL(12,2) DEFAULT 0,
  last_payment_date         DATE,
  voucher_generated         BOOLEAN DEFAULT FALSE,
  voucher_generated_at      TIMESTAMPTZ,
  
  cancellation_status       TEXT,
  cancellation_charge       DECIMAL(12,2),
  refund_expected           DECIMAL(12,2),
  refund_received           DECIMAL(12,2),
  refund_received_at        DATE,
  
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS vouchers (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  booking_id              UUID,
  booking_service_id      UUID,
  supplier_id             UUID,
  voucher_num             TEXT,
  guest_names             TEXT,
  travel_dates            TEXT,
  room_type               TEXT,
  meal_plan               TEXT,
  special_requests        TEXT,
  booking_reference       TEXT,
  agency_contact          TEXT,
  sent_to_supplier        BOOLEAN DEFAULT FALSE,
  sent_at                 TIMESTAMPTZ,
  file_url                TEXT,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS vendor_ledger (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  supplier_id             UUID,
  booking_id              UUID,
  booking_service_id      UUID,
  amount                  DECIMAL(12,2) NOT NULL,
  direction               TEXT NOT NULL DEFAULT 'agency_to_vendor',
  is_paid                 BOOLEAN DEFAULT FALSE,
  due_date                DATE,
  paid_date               DATE,
  payment_reference       TEXT,
  notes                   TEXT,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS cancellations (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  booking_id              UUID NOT NULL,
  booking_service_id      UUID,
  reason                  TEXT,
  reason_details          TEXT,
  service_status          TEXT DEFAULT 'initiated',
  cancellation_charge     DECIMAL(12,2) DEFAULT 0,
  refund_amount_client    DECIMAL(12,2) DEFAULT 0,
  refund_amount_vendor    DECIMAL(12,2) DEFAULT 0,
  refund_received_vendor  DECIMAL(12,2) DEFAULT 0,
  refund_gap              DECIMAL(12,2) DEFAULT 0,
  cancellation_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  cancelled_by            UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID,

);

CREATE TABLE IF NOT EXISTS miscellaneous_services (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  booking_id              UUID,
  service_type            TEXT NOT NULL, 
  vendor_name             TEXT,
  cost_price              DECIMAL(15, 2) DEFAULT 0,
  selling_price           DECIMAL(15, 2) DEFAULT 0,
  status                  TEXT DEFAULT 'pending',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS payment_transactions (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    invoice_id UUID,
    booking_id UUID, -- placeholder for when bookings module is built
    customer_id UUID,
    payment_method payment_method NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT, -- UTR, cheque number, UPI ref, etc.
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ

);

CREATE TABLE IF NOT EXISTS dashboard_stats_cache (

    tenant_id UUID PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS customer_health_cache (

  customer_id             UUID PRIMARY KEY,
  tenant_id               UUID NOT NULL,
  health_score            NUMERIC(5,2) DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS client_health (

  tenant_id               UUID PRIMARY KEY,
  health                  TEXT NOT NULL DEFAULT 'red',
  last_login              TIMESTAMPTZ,
  leads_this_week         INTEGER DEFAULT 0,
  actions_this_week       INTEGER DEFAULT 0,
  calculated_at           TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS push_subscriptions (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  user_id                 UUID NOT NULL,
  subscription            JSONB NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS import_logs (

  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  entity_type             TEXT NOT NULL,
  rows_count              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE TABLE IF NOT EXISTS lead_communications (

    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    user_id UUID,
    comm_type TEXT NOT NULL,   -- 'call'|'whatsapp'|'email'|'sms'|'in_person'
    direction TEXT NOT NULL,  -- 'inbound'|'outbound'
    summary TEXT,
    duration_mins INTEGER,
    comm_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()

);


-- 4. CONSTRAINTS (Foreign Keys)

ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE customers ADD CONSTRAINT fk_customers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE customers ADD CONSTRAINT fk_customers_referred_by_customers FOREIGN KEY (referred_by) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE customers ADD CONSTRAINT fk_customers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE customers ADD CONSTRAINT fk_customers_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE leads ADD CONSTRAINT fk_leads_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE leads ADD CONSTRAINT fk_leads_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,;

ALTER TABLE bookings ADD CONSTRAINT fk_bookings_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE itinerary_items ADD CONSTRAINT fk_itinerary_items_day_id_itinerary_days FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE,;

ALTER TABLE quotations ADD CONSTRAINT fk_quotations_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE quotations ADD CONSTRAINT fk_quotations_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE quotations ADD CONSTRAINT fk_quotations_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE quotations ADD CONSTRAINT fk_quotations_parent_quote_id_quotations FOREIGN KEY (parent_quote_id) REFERENCES quotations(id) ON DELETE SET NULL,;

ALTER TABLE quotations ADD CONSTRAINT fk_quotations_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE quotation_items ADD CONSTRAINT fk_quotation_items_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE invoices ADD CONSTRAINT fk_invoices_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE invoice_items ADD CONSTRAINT fk_invoice_items_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,;

ALTER TABLE bank_accounts ADD CONSTRAINT fk_bank_accounts_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE announcement_dismissals ADD CONSTRAINT fk_announcement_dismissals_announcement_id_announcements FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,;

ALTER TABLE announcement_dismissals ADD CONSTRAINT fk_announcement_dismissals_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE coupon_usage_logs ADD CONSTRAINT fk_coupon_usage_logs_coupon_id_coupons FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,;

ALTER TABLE tenant_settings ADD CONSTRAINT fk_tenant_settings_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE customer_merge_logs ADD CONSTRAINT fk_customer_merge_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE customer_merge_logs ADD CONSTRAINT fk_customer_merge_logs_primary_id_customers FOREIGN KEY (primary_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,;

ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE lead_attachments ADD CONSTRAINT fk_lead_attachments_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE lead_attachments ADD CONSTRAINT fk_lead_attachments_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE lead_documents ADD CONSTRAINT fk_lead_documents_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE lead_documents ADD CONSTRAINT fk_lead_documents_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referrer_tenant_id_tenants FOREIGN KEY (referrer_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referee_tenant_id_tenants FOREIGN KEY (referee_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,;

ALTER TABLE message_templates ADD CONSTRAINT fk_message_templates_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,;

ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_template_id_message_templates FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL,;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_task_id_tasks FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,;

ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE expense_categories ADD CONSTRAINT fk_expense_categories_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE markup_presets ADD CONSTRAINT fk_markup_presets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE markup_presets ADD CONSTRAINT fk_markup_presets_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE itinerary_days ADD CONSTRAINT fk_itinerary_days_itinerary_id_itineraries FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,;

ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,;

ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,;

ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id),;

ALTER TABLE visa_documents ADD CONSTRAINT fk_visa_documents_visa_tracking_id_visa_tracking FOREIGN KEY (visa_tracking_id) REFERENCES visa_tracking(id) ON DELETE CASCADE,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE documents ADD CONSTRAINT fk_documents_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE documents ADD CONSTRAINT fk_documents_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE documents ADD CONSTRAINT fk_documents_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,;

ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by_users FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE documents ADD CONSTRAINT fk_documents_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE master_assets ADD CONSTRAINT fk_master_assets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE master_assets ADD CONSTRAINT fk_master_assets_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE master_assets ADD CONSTRAINT fk_master_assets_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE resource_hub_links ADD CONSTRAINT fk_resource_hub_links_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE resource_hub_links ADD CONSTRAINT fk_resource_hub_links_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE resource_hub_links ADD CONSTRAINT fk_resource_hub_links_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_resolved_by_users FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE ticket_replies ADD CONSTRAINT fk_ticket_replies_ticket_id_support_tickets FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,;

ALTER TABLE ticket_replies ADD CONSTRAINT fk_ticket_replies_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_vendor_id_suppliers FOREIGN KEY (vendor_id) REFERENCES suppliers(id) ON DELETE CASCADE,;

ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_uploaded_by_users FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE agents_directory ADD CONSTRAINT fk_agents_directory_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE agents_directory ADD CONSTRAINT fk_agents_directory_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE network_members ADD CONSTRAINT fk_network_members_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE network_members ADD CONSTRAINT fk_network_members_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_posts ADD CONSTRAINT fk_network_feed_posts_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_posts ADD CONSTRAINT fk_network_feed_posts_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_posts ADD CONSTRAINT fk_network_feed_posts_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_parent_comment_id_network_feed_comments FOREIGN KEY (parent_comment_id) REFERENCES network_feed_comments(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_reactions ADD CONSTRAINT fk_network_feed_reactions_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE,;

ALTER TABLE network_feed_reactions ADD CONSTRAINT fk_network_feed_reactions_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE network_opportunities ADD CONSTRAINT fk_network_opportunities_posted_by_network_members FOREIGN KEY (posted_by) REFERENCES network_members(id) ON DELETE SET NULL,;

ALTER TABLE network_opportunities ADD CONSTRAINT fk_network_opportunities_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_requester_member_id_network_members FOREIGN KEY (requester_member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_target_member_id_network_members FOREIGN KEY (target_member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_requester_tenant_id_tenants FOREIGN KEY (requester_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE network_messages ADD CONSTRAINT fk_network_messages_sender_id_users FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE network_messages ADD CONSTRAINT fk_network_messages_receiver_id_users FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE network_post_quality_ratings ADD CONSTRAINT fk_network_post_quality_ratings_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE,;

ALTER TABLE network_post_quality_ratings ADD CONSTRAINT fk_network_post_quality_ratings_rater_member_id_network_members FOREIGN KEY (rater_member_id) REFERENCES network_members(id) ON DELETE CASCADE,;

ALTER TABLE workspace_messages ADD CONSTRAINT fk_workspace_messages_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE workspace_messages ADD CONSTRAINT fk_workspace_messages_sender_id_users FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE offers ADD CONSTRAINT fk_offers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE offers ADD CONSTRAINT fk_offers_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,;

ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,;

ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,;

ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL,;

ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,;

ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,;

ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,;

ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL,;

ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,;

ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL,;

ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_cancelled_by_users FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE miscellaneous_services ADD CONSTRAINT fk_miscellaneous_services_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE miscellaneous_services ADD CONSTRAINT fk_miscellaneous_services_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,;

ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,;

ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,;

ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_recorded_by_users FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE dashboard_stats_cache ADD CONSTRAINT fk_dashboard_stats_cache_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE customer_health_cache ADD CONSTRAINT fk_customer_health_cache_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,;

ALTER TABLE customer_health_cache ADD CONSTRAINT fk_customer_health_cache_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE client_health ADD CONSTRAINT fk_client_health_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_subscriptions_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_subscriptions_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,;

ALTER TABLE import_logs ADD CONSTRAINT fk_import_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,;

ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,;

ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,;

ALTER TABLE platform_changelog ADD CONSTRAINT fk_pcl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE coupon_usage_logs ADD CONSTRAINT fk_cul_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE platform_invoices ADD CONSTRAINT fk_pi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_tu FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_sa FOREIGN KEY (super_admin_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE visa_documents ADD CONSTRAINT uni_visa_track_doc UNIQUE (visa_tracking_id, doc_type);

ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_is_tt FOREIGN KEY (target_tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE platform_changelog ADD CONSTRAINT fk_pcl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE coupons ADD CONSTRAINT fk_c_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE platform_payments ADD CONSTRAINT fk_pp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE platform_settings ADD CONSTRAINT fk_ps_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;


-- 5. ROW LEVEL SECURITY

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

ALTER TABLE visa_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

ALTER TABLE group_booking_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE visa_tracking ENABLE ROW LEVEL SECURITY;

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE dashboard_stats_cache ENABLE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_access ON %I FOR ALL USING (tenant_id::text = auth_tenant_id())', tbl);

CREATE POLICY sa_all ON %I FOR ALL USING (is_super_admin())', tbl);


-- 6. INDEXES

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);

CREATE INDEX IF NOT EXISTS idx_dashboard_cache_tenant ON dashboard_stats_cache(tenant_id);

CREATE INDEX IF NOT EXISTS idx_visa_docs_tracking ON visa_documents(visa_tracking_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notifs_unread ON notifications(user_id) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_lead_comms_lead ON lead_communications(lead_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON itinerary_items(day_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_group_members_booking ON group_booking_members(booking_id);

CREATE INDEX IF NOT EXISTS idx_visa_tracking_tenant ON visa_tracking(tenant_id);

CREATE INDEX IF NOT EXISTS idx_bookings_lead ON bookings(lead_id);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_itineraries_lead ON itineraries(lead_id);

CREATE INDEX IF NOT EXISTS idx_itineraries_tenant ON itineraries(tenant_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);

CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);

CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_visa_tracking_lead ON visa_tracking(lead_id);


-- 7. FUNCTIONS & TRIGGERS


COMMIT;