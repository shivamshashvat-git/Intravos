-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 06 - Global Marketplace & Suppliers
-- Isolation: Cross-Tenant Supply Chain & B2B Feeds
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vendor_rate_cards (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vendor_id               UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
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
  uploaded_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agents_directory (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

-- B2B Feed Tables
CREATE TABLE IF NOT EXISTS network_members (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name            TEXT,
  bio                     TEXT,
  specializations         TEXT[],
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS network_feed_posts (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id               UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS network_feed_comments (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID NOT NULL REFERENCES network_feed_posts(id) ON DELETE CASCADE,
  member_id               UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
  comment_text            TEXT NOT NULL,
  parent_comment_id       UUID REFERENCES network_feed_comments(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS network_feed_reactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID NOT NULL REFERENCES network_feed_posts(id) ON DELETE CASCADE,
  member_id               UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
  reaction_type           TEXT DEFAULT 'like',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, member_id)
);

CREATE TABLE IF NOT EXISTS network_opportunities (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  posted_by               UUID REFERENCES network_members(id) ON DELETE SET NULL,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  requester_member_id     UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
  target_member_id        UUID REFERENCES network_members(id) ON DELETE CASCADE,
  requester_tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
  sender_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  message                 TEXT NOT NULL,
  is_read                 BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS network_post_quality_ratings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id                 UUID REFERENCES network_feed_posts(id) ON DELETE CASCADE,
  rater_member_id         UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
  rating                  INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, rater_member_id)
);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  message                 TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  description             TEXT,
  destination             TEXT,
  image_url               TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- OPERATIONAL DISRUPTIONS & VENDOR LEDGERS (Requires Suppliers and Bookings combined)
-- ==========================================

CREATE TABLE IF NOT EXISTS booking_services (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id                UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id               UUID REFERENCES suppliers(id) ON DELETE SET NULL,
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
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id              UUID REFERENCES bookings(id) ON DELETE CASCADE,
  booking_service_id      UUID REFERENCES booking_services(id) ON DELETE SET NULL,
  supplier_id             UUID REFERENCES suppliers(id) ON DELETE SET NULL,
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_ledger (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id             UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  booking_id              UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_service_id      UUID REFERENCES booking_services(id) ON DELETE SET NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  direction               TEXT NOT NULL DEFAULT 'agency_to_vendor',
  is_paid                 BOOLEAN DEFAULT FALSE,
  due_date                DATE,
  paid_date               DATE,
  payment_reference       TEXT,
  notes                   TEXT,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cancellations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id              UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_service_id      UUID REFERENCES booking_services(id) ON DELETE SET NULL,
  reason                  TEXT,
  reason_details          TEXT,
  service_status          TEXT DEFAULT 'initiated',
  cancellation_charge     DECIMAL(12,2) DEFAULT 0,
  refund_amount_client    DECIMAL(12,2) DEFAULT 0,
  refund_amount_vendor    DECIMAL(12,2) DEFAULT 0,
  refund_received_vendor  DECIMAL(12,2) DEFAULT 0,
  refund_gap              DECIMAL(12,2) DEFAULT 0,
  cancellation_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  cancelled_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS miscellaneous_services (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id              UUID REFERENCES bookings(id) ON DELETE CASCADE,
  service_type            TEXT NOT NULL, 
  vendor_name             TEXT,
  cost_price              DECIMAL(15, 2) DEFAULT 0,
  selling_price           DECIMAL(15, 2) DEFAULT 0,
  status                  TEXT DEFAULT 'pending',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

-- Backfill Payment Transactions -> Vendor Ledger & Booking Services FKs
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  invoice_id              UUID REFERENCES invoices(id) ON DELETE SET NULL,
  account_id              UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  vendor_id               UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  booking_service_id      UUID REFERENCES booking_services(id) ON DELETE SET NULL,
  amount                  DECIMAL(12,2) NOT NULL,
  direction               TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  is_refund               BOOLEAN DEFAULT FALSE,
  payment_method          payment_method,
  notes                   TEXT,
  transaction_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);
