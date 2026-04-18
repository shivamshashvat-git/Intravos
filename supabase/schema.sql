-- ============================================================
-- INTRAVOS GROUND TRUTH MASTER SCHEMA
-- Combined Industrialized Migration File
-- Order: Extensions > Types > Tables (Clean) > Constraints > Logic
-- Generated on: 2026-04-18
-- ============================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- 2. CUSTOM TYPES (ENUMS)
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'partner'); 
CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram'); 
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold'); 
CREATE TYPE lead_priority AS ENUM ('low', 'normal', 'high', 'urgent'); 
CREATE TYPE comm_type AS ENUM ('call', 'whatsapp', 'email', 'sms', 'in_person'); 
CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound'); 
CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi'); 
CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'); 
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled'); 
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised'); 
CREATE TYPE itinerary_item_type AS ENUM ('hotel', 'flight', 'activity', 'transfer', 'note', 'meal', 'internal_note', 'insurance', 'lounge', 'sim_card', 'forex'); 
CREATE TYPE visa_status AS ENUM ('not_started', 'docs_collecting', 'docs_collected', 'applied', 'in_process', 'approved', 'rejected'); 
CREATE TYPE passport_holder AS ENUM ('customer', 'agency', 'vfs', 'embassy', 'returned'); 
CREATE TYPE doc_status AS ENUM ('pending', 'uploaded', 'verified', 'not_needed'); 
CREATE TYPE notification_type AS ENUM ('lead_assigned', 'lead_status_changed', 'note_added', 'followup_due', 'followup_overdue', 'engagement_birthday', 'engagement_anniversary', 'engagement_dormant', 'engagement_post_trip', 'task_assigned', 'task_due', 'payment_pending', 'payment_received', 'payment_overdue', 'trial_expiring', 'trial_expired', 'announcement', 'system'); 
CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'rewarded', 'expired'); 
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed'); 
CREATE TYPE ticket_type AS ENUM ('support', 'bug', 'feature_request'); 
CREATE TYPE changelog_action AS ENUM (
  'tenant_created', 'tenant_activated', 'tenant_paused', 'tenant_plan_changed', 'trial_started', 
  'trial_extended', 'trial_expired', 'trial_converted', 'payment_received_platform', 'feature_toggled', 
  'feature_locked', 'feature_unlocked', 'user_created', 'user_deactivated', 'settings_changed', 
  'ticket_created', 'ticket_resolved', 'announcement_created', 'maintenance_scheduled', 
  'subscription_activated', 'subscription_renewed', 'subscription_grace', 'subscription_limited', 
  'subscription_suspended', 'free_access_granted', 'free_access_expired', 'upgrade_requested', 
  'upgrade_approved', 'upgrade_rejected', 'pricing_changed', 'customer_merged', 
  'impersonation_started', 'impersonation_ended'
);
CREATE TYPE booking_status AS ENUM ('confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE refund_status AS ENUM ('not_applicable', 'pending', 'partial', 'full', 'none');


-- 3. CORE PLATFORM TABLES (No References yet)
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
  features_enabled          JSONB NOT NULL DEFAULT '[]',
  agency_address            TEXT,
  agency_phone              TEXT,
  agency_email              TEXT,
  gstin                     TEXT,
  pan                       TEXT,
  agency_website            TEXT,
  primary_color             TEXT,
  secondary_color           TEXT,
  invoice_prefix            TEXT DEFAULT 'INV',
  invoice_next_num          INTEGER DEFAULT 1,
  invoice_bank_text         TEXT,
  quote_prefix              TEXT DEFAULT 'Q',
  quote_next_num            INTEGER DEFAULT 1,
  quote_validity            INTEGER DEFAULT 7,
  quote_terms               TEXT,
  quote_inclusions          TEXT,
  quote_exclusions          TEXT,
  referral_code             TEXT UNIQUE,
  max_seats                 INTEGER DEFAULT 2,
  storage_limit_mb          INTEGER DEFAULT 5120,
  storage_used_mb           INTEGER DEFAULT 0,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL, -- FK added later
  auth_id                   UUID UNIQUE NOT NULL,
  email                     TEXT NOT NULL,
  name                      TEXT NOT NULL,
  phone                     TEXT,
  role                      user_role NOT NULL DEFAULT 'staff',
  avatar_url                TEXT,
  designation               TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at             TIMESTAMPTZ,
  tips_seen                 JSONB DEFAULT '[]',
  milestones                JSONB DEFAULT '[]',
  notif_prefs               JSONB DEFAULT '{}',
  features_override         JSONB,
  network_access            BOOLEAN DEFAULT FALSE,
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 4. CRM & OPERATIONAL TABLES
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
  date_of_birth           DATE,
  wedding_anniversary     DATE,
  gender                  TEXT,
  preferred_destinations  TEXT,
  preferred_airlines      TEXT,
  preferred_hotel_class   TEXT,
  dietary_preferences     TEXT,
  special_needs           TEXT,
  passport_number         TEXT,
  passport_expiry         DATE,
  pan_number              TEXT,
  gst_number              TEXT,
  aadhar_number           TEXT,
  lifetime_value          DECIMAL(12,2) DEFAULT 0,
  total_bookings          INTEGER DEFAULT 0,
  total_spent             DECIMAL(12,2) DEFAULT 0,
  last_booking_at         TIMESTAMPTZ,
  last_contacted_at       TIMESTAMPTZ,
  customer_type           TEXT DEFAULT 'individual',
  tags                    TEXT[] DEFAULT '{}',
  lead_source             TEXT,
  referred_by             UUID,
  important_dates         JSONB DEFAULT '[]',
  passport_details        JSONB,
  preferences             JSONB DEFAULT '{}',
  consent_profile         JSONB DEFAULT '{}',
  metadata                JSONB DEFAULT '{}',
  notes                   TEXT,
  is_archived             BOOLEAN DEFAULT FALSE,
  bookings_count          INTEGER DEFAULT 0,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID
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
  pax_children            INTEGER DEFAULT 0,
  pax_infants             INTEGER DEFAULT 0,
  price_seen              DECIMAL(12,2),
  source                  lead_source NOT NULL DEFAULT 'manual',
  status                  lead_status NOT NULL DEFAULT 'new',
  priority                lead_priority NOT NULL DEFAULT 'normal',
  budget                  DECIMAL(12,2) DEFAULT 0,
  selling_price           DECIMAL(12,2) DEFAULT 0, -- Renamed from final_price
  cost_price              DECIMAL(12,2) DEFAULT 0, -- Renamed from vendor_cost
  profit                  DECIMAL(12,2) DEFAULT 0,
  margin                  DECIMAL(12,2) DEFAULT 0,
  amount_collected        DECIMAL(12,2) DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID
);

CREATE TABLE IF NOT EXISTS bookings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL,
    lead_id                 UUID,
    customer_id             UUID,
    invoice_id              UUID,
    quotation_id             UUID,
    booking_ref             TEXT NOT NULL,
    customer_name           TEXT,
    customer_phone          TEXT,
    customer_email          TEXT,
    destination             TEXT,
    travel_start_date       DATE,
    travel_end_date         DATE,
    traveler_count          INTEGER DEFAULT 1,
    pax_adults              INTEGER DEFAULT 1,
    pax_children            INTEGER DEFAULT 0,
    pax_infants             INTEGER DEFAULT 0,
    total_cost              DECIMAL(12,2) DEFAULT 0,
    total_selling_price     DECIMAL(12,2) DEFAULT 0,
    amount_collected        DECIMAL(12,2) DEFAULT 0,
    special_requests        TEXT,
    internal_notes          TEXT,
    status                  booking_status DEFAULT 'confirmed',
    cancellation_reason     TEXT,
    cancellation_notes      TEXT,
    cancellation_date       DATE,
    refund_status           refund_status DEFAULT 'not_applicable',
    refund_due_to_client    DECIMAL(12,2) DEFAULT 0,
    supplier_refund_due     DECIMAL(12,2) DEFAULT 0,
    supplier_refund_received DECIMAL(12,2) DEFAULT 0,
    agency_cancellation_loss DECIMAL(12,2) DEFAULT 0,
    created_by              UUID,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);


-- 5. FINANCE TABLES
CREATE TABLE IF NOT EXISTS bank_accounts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL,
    account_name            TEXT NOT NULL,
    bank_name               TEXT NOT NULL,
    acc_type                account_type NOT NULL DEFAULT 'current',
    running_balance         DECIMAL(14,2) DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quotations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID,
  customer_id             UUID,
  quote_number            TEXT NOT NULL,
  customer_name           TEXT,
  customer_phone          TEXT,
  customer_email          TEXT,
  customer_gstin          TEXT,
  destination             TEXT,
  start_date              DATE,
  end_date                DATE,
  guests                  INTEGER,
  rooms                   INTEGER,
  status                  quotation_status NOT NULL DEFAULT 'draft',
  subtotal                DECIMAL(12,2) DEFAULT 0,
  gst_rate                DECIMAL(5,2) DEFAULT 5,
  cgst                    DECIMAL(12,2) DEFAULT 0,
  sgst                    DECIMAL(12,2) DEFAULT 0,
  igst                    DECIMAL(12,2) DEFAULT 0,
  total_amount            DECIMAL(12,2) DEFAULT 0,
  total_cost_price        DECIMAL(12,2) DEFAULT 0, -- RENAME from total_vendor_cost
  total_margin            DECIMAL(12,2) DEFAULT 0,
  inclusions              TEXT,
  exclusions              TEXT,
  terms                   TEXT,
  valid_until             DATE,
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
  gst_rate                DECIMAL(5,2),
  gst_amount              DECIMAL(12,2) DEFAULT 0,
  cost_price              DECIMAL(12,2) DEFAULT 0, -- RENAME from vendor_cost
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
  customer_name           TEXT,
  customer_phone          TEXT,
  customer_email          TEXT,
  customer_gstin          TEXT,
  place_of_supply         TEXT,
  agency_name             TEXT,
  agency_address          TEXT,
  agency_gstin            TEXT,
  agency_pan              TEXT,
  status                  invoice_status NOT NULL DEFAULT 'draft',
  invoice_type            TEXT DEFAULT 'standard',
  financial_year          TEXT,
  subtotal                DECIMAL(12,2) DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS payment_transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL,
    invoice_id              UUID,
    booking_id              UUID,
    customer_id             UUID,
    vendor_id               UUID, -- Added for Supplier payments
    booking_service_id      UUID, -- Added for granular tracking
    account_id              UUID, -- Added for Bank link
    amount                  DECIMAL(12,2) NOT NULL,
    direction               TEXT DEFAULT 'in', -- 'in' | 'out'
    payment_method          payment_method NOT NULL,
    payment_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number        TEXT,
    notes                   TEXT,
    recorded_by             UUID,
    is_refund               BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);


-- 6. ADDITIONAL MODULES
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

CREATE TABLE IF NOT EXISTS visa_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID,
    pax_name TEXT NOT NULL,
    passport_number TEXT,
    visa_type TEXT,
    country TEXT,
    status visa_status DEFAULT 'not_started',
    current_holder passport_holder DEFAULT 'agency',
    submission_date DATE,
    appointment_date DATE,
    expiry_date DATE,
    notes TEXT,
    assigned_to UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visa_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visa_tracking_id UUID NOT NULL,
    doc_type TEXT NOT NULL,
    status doc_status DEFAULT 'pending',
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assigned_to UUID,
    lead_id UUID,
    booking_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    is_done BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notif_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    lead_id UUID,
    booking_id UUID,
    task_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS suppliers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  contact_person          TEXT,
  supplier_type           TEXT,
  address                 TEXT,
  city                    TEXT,
  country                 TEXT DEFAULT 'India',
  gst_number              TEXT,
  payment_terms           TEXT DEFAULT 'net_30',
  currency                TEXT DEFAULT 'INR',
  is_active               BOOLEAN DEFAULT TRUE,
  created_by              UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS booking_services (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID NOT NULL,
  tenant_id                 UUID NOT NULL,
  supplier_id               UUID,
  service_type              itinerary_item_type NOT NULL,
  title                     TEXT NOT NULL,
  service_start_date        DATE,
  service_end_date          DATE,
  cost_price                DECIMAL(12,2) DEFAULT 0, -- RENAME from cost
  selling_price             DECIMAL(12,2) DEFAULT 0, -- RENAME from price_to_client
  paid_to_supplier          DECIMAL(12,2) DEFAULT 0,
  supplier_payment_status   TEXT DEFAULT 'unpaid',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);


-- 7. PLATFORM HUD TABLES (Clean)
CREATE TABLE IF NOT EXISTS sales_inquiries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  organization        TEXT,
  status              TEXT DEFAULT 'new',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT NOT NULL UNIQUE,
  discount_pct        INTEGER DEFAULT 0,
  valid_from          DATE,
  valid_to            DATE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id                  TEXT PRIMARY KEY,
  settings            JSONB NOT NULL,
  updated_by          UUID, 
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_stats_cache (
  tenant_id               UUID PRIMARY KEY,
  total_revenue           DECIMAL(14,2) DEFAULT 0,
  active_leads_count      INTEGER DEFAULT 0,
  leads_today_count       INTEGER DEFAULT 0,
  tasks_due_today_count   INTEGER DEFAULT 0,
  active_bookings_count    INTEGER DEFAULT 0,
  revenue_this_month      DECIMAL(14,2) DEFAULT 0,
  collected_this_month    DECIMAL(14,2) DEFAULT 0,
  outstanding_amount      DECIMAL(14,2) DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    user_id UUID,
    comm_type TEXT NOT NULL, 
    direction TEXT NOT NULL,
    summary TEXT,
    duration_mins INTEGER,
    comm_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL,
  lead_id                 UUID NOT NULL,
  user_id                 UUID NOT NULL,
  note                    TEXT,
  is_pinned               BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);


-- 8. CONSTRAINTS (FOREIGN KEYS)
-- Users & Tenants
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- CRM
ALTER TABLE customers ADD CONSTRAINT fk_cust_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE customers ADD CONSTRAINT fk_cust_referrer FOREIGN KEY (referred_by) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE leads ADD CONSTRAINT fk_leads_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_user FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Operations
ALTER TABLE bookings ADD CONSTRAINT fk_book_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD CONSTRAINT fk_book_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_book_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Finance
ALTER TABLE quotations ADD CONSTRAINT fk_quote_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE quotations ADD CONSTRAINT fk_quote_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE quotation_items ADD CONSTRAINT fk_qi_quote FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT fk_inv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE invoice_items ADD CONSTRAINT fk_ii_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE payment_transactions ADD CONSTRAINT fk_pt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE payment_transactions ADD CONSTRAINT fk_pt_inv FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE payment_transactions ADD CONSTRAINT fk_pt_book FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE bank_accounts ADD CONSTRAINT fk_acc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Modular
ALTER TABLE itineraries ADD CONSTRAINT fk_it_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE itinerary_days ADD CONSTRAINT fk_id_it FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE;
ALTER TABLE itinerary_items ADD CONSTRAINT fk_ii_day FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_book FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE visa_documents ADD CONSTRAINT fk_vd_visa FOREIGN KEY (visa_tracking_id) REFERENCES visa_tracking(id) ON DELETE CASCADE;
ALTER TABLE lead_communications ADD CONSTRAINT fk_lc_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE lead_notes ADD CONSTRAINT fk_ln_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- ── UNIQUE CONSTRAINTS ──
ALTER TABLE visa_documents ADD CONSTRAINT uni_visa_track_doc UNIQUE (visa_tracking_id, doc_type);


-- 9. FUNCTIONS & SECURITY
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS TEXT AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin';
$$ LANGUAGE sql STABLE;

-- RLS Enable
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_stats_cache ENABLE ROW LEVEL SECURITY;

-- ── SPECIFIC SECURITY OVERRIDES ──

-- Allow users to read their own profile row during/after login
DROP POLICY IF EXISTS user_read_self ON users;
CREATE POLICY user_read_self ON users FOR SELECT USING (auth_id = auth.uid());

-- Allow users to read their parent tenant data
DROP POLICY IF EXISTS tenant_read_own ON tenants;
CREATE POLICY tenant_read_own ON tenants FOR SELECT USING (id::text = auth_tenant_id());

-- Dynamic Policy Application
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS sa_all ON %I', tbl);
    EXECUTE format('CREATE POLICY sa_all ON %I FOR ALL USING (is_super_admin())', tbl);
  END LOOP;
END;
$$;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename NOT IN ('plans', 'tenants', 'sales_inquiries', 'platform_settings', 'coupons')
  LOOP
    PERFORM 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'tenant_id';
    IF FOUND THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_access ON %I', tbl);
      EXECUTE format('CREATE POLICY tenant_access ON %I FOR ALL USING (tenant_id::text = auth_tenant_id())', tbl);
    END IF;
  END LOOP;
END;
$$;

-- 10. SPECIAL RPCs
CREATE OR REPLACE FUNCTION get_booking_hub(p_tenant_id UUID, p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    v_result := (
        SELECT jsonb_build_object(
            'booking', (SELECT to_jsonb(b) FROM bookings b WHERE b.id = p_booking_id AND b.tenant_id = p_tenant_id),
            'customer', (SELECT to_jsonb(c) FROM customers c WHERE c.id = (SELECT customer_id FROM bookings WHERE id = p_booking_id)),
            'services', (SELECT jsonb_agg(s) FROM booking_services s WHERE s.booking_id = p_booking_id AND s.tenant_id = p_tenant_id AND s.deleted_at IS NULL),
            'payments', (SELECT jsonb_agg(p) FROM payment_transactions p WHERE p.booking_id = p_booking_id AND p.tenant_id = p_tenant_id AND p.deleted_at IS NULL)
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 11. VIEWS
CREATE OR REPLACE VIEW v_trash_items WITH (security_invoker = on) AS
  SELECT 'leads'::TEXT AS table_name, 'Leads'::TEXT AS module_name, tenant_id, id AS item_id, customer_name AS item_label, deleted_at FROM leads WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'customers', 'Customers', tenant_id, id AS item_id, name, deleted_at FROM customers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'quotations', 'Quotations', tenant_id, id AS item_id, quote_number, deleted_at FROM quotations WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT 'invoices', 'Invoices', tenant_id, id AS item_id, invoice_number, deleted_at FROM invoices WHERE deleted_at IS NOT NULL;


COMMIT;