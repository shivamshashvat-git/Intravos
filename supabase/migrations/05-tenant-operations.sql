-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 05 - Tenant Operations
-- Isolation: Itineraries, Bookings, Logistics, Visas
-- ============================================================

CREATE TABLE IF NOT EXISTS itineraries (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  title                   TEXT NOT NULL,
  destination             TEXT,
  share_token             TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_shared               BOOLEAN NOT NULL DEFAULT FALSE,
  is_template             BOOLEAN NOT NULL DEFAULT FALSE,
  template_name           TEXT,
  option_label            TEXT,
  option_group            TEXT,
  start_date              DATE,
  end_date                DATE,
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id            UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number              INTEGER NOT NULL,
  title                   TEXT,
  description             TEXT,
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id                  UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  item_type               itinerary_item_type NOT NULL,
  title                   TEXT NOT NULL,
  description             TEXT,
  time_val                TEXT,
  sort_order              INTEGER DEFAULT 0,
  media_urls              JSONB DEFAULT '[]',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bookings (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                   UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id               UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id                UUID REFERENCES invoices(id) ON DELETE SET NULL,
  quotation_id              UUID REFERENCES quotations(id) ON DELETE SET NULL,
  booking_ref               TEXT NOT NULL,
  customer_name             TEXT,
  customer_phone            TEXT,
  customer_email            TEXT,
  destination               TEXT,
  travel_start_date         DATE,
  travel_end_date           DATE,
  traveler_count            INTEGER DEFAULT 1,
  total_cost                DECIMAL(12,2) DEFAULT 0,
  total_selling_price       DECIMAL(12,2) DEFAULT 0,
  amount_collected          DECIMAL(12,2) DEFAULT 0,
  special_requests          TEXT,
  internal_notes            TEXT,
  status                    TEXT DEFAULT 'confirmed',
  
  -- Cancellation specifics internally tracked
  cancellation_reason       TEXT,
  cancellation_notes        TEXT,
  cancellation_date         DATE,
  refund_status             TEXT,
  refund_due_to_client      DECIMAL(12,2),
  supplier_refund_due       DECIMAL(12,2),
  supplier_refund_received  DECIMAL(12,2),
  agency_cancellation_loss  DECIMAL(12,2),
  
  created_by                UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS group_booking_members (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id              UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  member_name             TEXT NOT NULL,
  room_sharing            TEXT,
  add_ons                 JSONB DEFAULT '[]',
  base_cost               DECIMAL(12,2) DEFAULT 0,
  room_upgrade            DECIMAL(12,2) DEFAULT 0,
  add_on_total            DECIMAL(12,2) DEFAULT 0,
  per_person_total        DECIMAL(12,2) DEFAULT 0,
  invoice_id              UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visa_tracking (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  traveler_name           TEXT NOT NULL,
  applicant_name          TEXT,
  destination             TEXT,
  visa_type               TEXT DEFAULT 'tourist',
  passport_number         TEXT,
  passport_holder         TEXT DEFAULT 'customer',
  passport_expiry         DATE,
  fee_paid_by             TEXT DEFAULT 'customer',
  visa_fee                DECIMAL(12,2) DEFAULT 0,
  service_charge          DECIMAL(12,2) DEFAULT 0,
  appointment_date        DATE,
  submission_date         DATE,
  expected_date           DATE,
  approved_date           DATE,
  rejection_reason        TEXT,
  vfs_reference           TEXT,
  embassy_reference       TEXT,
  notes                   TEXT,
  assigned_to             UUID REFERENCES users(id) ON DELETE SET NULL,
  status                  visa_status NOT NULL DEFAULT 'not_started',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visa_documents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visa_tracking_id        UUID NOT NULL REFERENCES visa_tracking(id) ON DELETE CASCADE,
  doc_type                TEXT NOT NULL,
  file_url                TEXT,
  storage_bucket          TEXT,
  storage_path            TEXT,
  status                  doc_status NOT NULL DEFAULT 'pending',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS travel_insurance_policies (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id              UUID REFERENCES bookings(id) ON DELETE SET NULL,
  policy_number           TEXT NOT NULL,
  provider                TEXT,
  coverage_type           TEXT DEFAULT 'basic',
  claim_status            TEXT DEFAULT 'none',
  start_date              DATE,
  end_date                DATE,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id              UUID REFERENCES bookings(id) ON DELETE SET NULL,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
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
  uploaded_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS master_assets (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_type              TEXT,
  title                   TEXT NOT NULL,
  description             TEXT,
  content                 JSONB,
  tags                    JSONB DEFAULT '[]',
  is_global               BOOLEAN DEFAULT FALSE,
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resource_hub_links (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  subject                 TEXT NOT NULL,
  description             TEXT,
  ticket_type             ticket_type DEFAULT 'support',
  status                  ticket_status DEFAULT 'open',
  screenshot_url          TEXT,
  browser_info            TEXT,
  page_url                TEXT,
  resolution              TEXT,
  resolved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id               UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  message                 TEXT NOT NULL,
  is_admin                BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS post_trip_feedback (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE CASCADE,
  booking_id              UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Backfill FKs that were deferred in Phase 03
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
