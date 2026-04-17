-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 03 - Tenant CRM
-- Isolation: Customers, Leads, and Engagement
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
  referred_by             UUID REFERENCES customers(id) ON DELETE SET NULL,
  
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customer_merge_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  primary_id              UUID REFERENCES customers(id) ON DELETE SET NULL,
  merged_ids              UUID[] NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS associated_travelers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id             UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
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
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leads (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,
  assigned_to             UUID REFERENCES users(id) ON DELETE SET NULL,
  
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
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE CASCADE,
  entity_type             TEXT,
  entity_id               UUID,
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note                    TEXT,
  content                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lead_followups (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date                TIMESTAMPTZ NOT NULL,
  note                    TEXT,
  is_done                 BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lead_attachments (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  file_url                TEXT NOT NULL,
  file_name               TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lead_documents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  doc_type                TEXT NOT NULL,
  file_url                TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_id                 UUID REFERENCES leads(id) ON DELETE CASCADE,
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
  referrer_tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referee_tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
  status                  referral_status DEFAULT 'pending',
  admin_notes             TEXT,
  fulfilled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS message_templates (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  content                 TEXT NOT NULL,
  template_text           TEXT,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS engagement_log (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id             UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type              TEXT NOT NULL,
  engagement_type         TEXT,
  channel                 TEXT,
  template_id             UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  message_sent            TEXT,
  meta                    JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: tasks references bookings(id) but that table will be created in operations.
-- The foreign key for booking_id will be applied later.
CREATE TABLE IF NOT EXISTS tasks (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_to             UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  booking_id              UUID, 
  title                   TEXT NOT NULL,
  description             TEXT,
  status                  TEXT DEFAULT 'pending',
  priority                TEXT DEFAULT 'medium',
  is_done                 BOOLEAN DEFAULT FALSE,
  due_date                TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  notif_type              notification_type NOT NULL,
  title                   TEXT NOT NULL,
  message                 TEXT,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  is_read                 BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id                 UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
  title                   TEXT NOT NULL,
  event_type              TEXT,
  event_date              DATE NOT NULL,
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  deleted_by              UUID REFERENCES users(id) ON DELETE SET NULL
);
