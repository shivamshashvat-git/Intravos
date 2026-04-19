-- Intravos Version 1 Schema
-- Version: 1.0
-- Generated: 2026-04-19
-- Total tables: 79
-- Single source of truth. Run on a fresh Supabase instance to get the complete schema.

BEGIN;

-- Section 1: Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Section 2: Custom ENUMs (all idempotent DO blocks)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'enquiry', 'confirmed', 'partial_payment', 'full_payment', 'in_progress', 'completed', 'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'changelog_action') THEN
    CREATE TYPE changelog_action AS ENUM (
      'tenant_created', 'tenant_activated', 'tenant_paused', 'tenant_plan_changed',
      'trial_started', 'trial_extended', 'trial_expired', 'trial_converted',
      'payment_received_platform', 'feature_toggled', 'feature_locked', 'feature_unlocked',
      'user_created', 'user_deactivated', 'settings_changed', 'ticket_created',
      'ticket_resolved', 'announcement_created', 'maintenance_scheduled',
      'subscription_activated', 'subscription_renewed', 'subscription_grace',
      'subscription_limited', 'subscription_suspended', 'free_access_granted',
      'free_access_expired', 'upgrade_requested', 'upgrade_approved', 'upgrade_rejected',
      'pricing_changed', 'customer_merged', 'impersonation_started', 'impersonation_ended'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comm_direction') THEN
    CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comm_type') THEN
    CREATE TYPE comm_type AS ENUM ('call', 'whatsapp', 'email', 'sms', 'in_person');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_status') THEN
    CREATE TYPE doc_status AS ENUM ('pending', 'uploaded', 'verified', 'not_needed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itinerary_item_type') THEN
    CREATE TYPE itinerary_item_type AS ENUM ('hotel', 'flight', 'activity', 'transfer', 'note', 'meal', 'internal_note', 'insurance', 'lounge', 'sim_card', 'forex');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_priority') THEN
    CREATE TYPE lead_priority AS ENUM ('low', 'normal', 'high', 'urgent');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'lead_assigned', 'lead_status_changed', 'note_added', 'followup_due',
      'followup_overdue', 'engagement_birthday', 'engagement_anniversary',
      'engagement_dormant', 'engagement_post_trip', 'task_assigned', 'task_due',
      'payment_pending', 'payment_received', 'payment_overdue', 'trial_expiring',
      'trial_expired', 'announcement', 'system'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passport_holder') THEN
    CREATE TYPE passport_holder AS ENUM ('customer', 'agency', 'vfs', 'embassy', 'returned');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quotation_status') THEN
    CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
    CREATE TYPE referral_status AS ENUM ('pending', 'converted', 'rewarded', 'expired');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
    CREATE TYPE refund_status AS ENUM ('not_applicable', 'pending', 'partial', 'full', 'none');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_type') THEN
    CREATE TYPE ticket_type AS ENUM ('support', 'bug', 'feature_request');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'super_admin', 'platform_manager', 'ivobot', 
      'agency_admin', 'secondary_admin', 'staff', 
      'admin', 'partner'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visa_status') THEN
    CREATE TYPE visa_status AS ENUM ('not_started', 'documents_pending', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled');
  END IF;
END $$;

-- Section 3: Table definitions (all CREATE TABLE IF NOT EXISTS)
DO $$
BEGIN
  IF to_regclass('public.sales_requests') IS NULL AND to_regclass('public.sales_inquiries') IS NOT NULL THEN
    ALTER TABLE public.sales_inquiries RENAME TO sales_requests;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_seats INTEGER NOT NULL DEFAULT 1,
  storage_limit_mb INTEGER NOT NULL DEFAULT 1024,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  trial_end DATE DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_client BOOLEAN NOT NULL DEFAULT FALSE,
  grace_until TIMESTAMPTZ,
  limited_until TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  annual_price NUMERIC(12,2),
  features_enabled JSONB NOT NULL DEFAULT '[]',
  agency_address TEXT,
  agency_phone TEXT,
  agency_email TEXT,
  bank_details JSONB DEFAULT '{}',
  max_seats INTEGER DEFAULT 2,
  storage_limit_mb INTEGER DEFAULT 5120,
  storage_used_mb INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  payout_bank_details JSONB,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_next_num INTEGER DEFAULT 1,
  invoice_bank_text TEXT,
  quote_prefix TEXT DEFAULT 'Q',
  quote_next_num INTEGER DEFAULT 1,
  quote_validity INTEGER DEFAULT 7,
  quote_terms TEXT,
  quote_inclusions TEXT,
  quote_exclusions TEXT,
  gstin TEXT,
  pan TEXT,
  agency_state TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  agency_website TEXT,
  health_score INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  auth_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  tips_seen JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  notif_prefs JSONB DEFAULT '{}',
  features_override JSONB,
  network_access BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_role user_role,
  announcement_type TEXT DEFAULT 'feature',
  is_active BOOLEAN DEFAULT TRUE,
  ends_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  announcement_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  alt_phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  date_of_birth DATE,
  wedding_anniversary DATE,
  gender TEXT,
  preferred_destinations TEXT,
  preferred_airlines TEXT,
  preferred_hotel_class TEXT,
  dietary_preferences TEXT,
  special_needs TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  pan_number TEXT,
  gst_number TEXT,
  aadhar_number TEXT,
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  last_booking_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  customer_type TEXT DEFAULT 'individual',
  tags TEXT[] DEFAULT '{}',
  lead_source TEXT,
  referred_by UUID,
  important_dates JSONB DEFAULT '[]',
  passport_details JSONB,
  preferences JSONB DEFAULT '{}',
  consent_profile JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  bookings_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS associated_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  passport_country TEXT,
  nationality TEXT DEFAULT 'Indian',
  dietary_preferences TEXT,
  special_needs TEXT,
  frequent_flyer TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID,
  assigned_to UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  destination TEXT,
  hotel_name TEXT,
  location TEXT,
  checkin_date DATE,
  checkout_date DATE,
  travel_start_date DATE,
  guests INTEGER DEFAULT 1,
  rooms INTEGER DEFAULT 1,
  pax_adults INTEGER DEFAULT 1,
  price_seen NUMERIC(12,2),
  source lead_source NOT NULL DEFAULT 'manual',
  status lead_status NOT NULL DEFAULT 'new',
  priority lead_priority NOT NULL DEFAULT 'normal',
  budget NUMERIC(12,2) DEFAULT 0,
  final_price NUMERIC(12,2) DEFAULT 0,
  vendor_cost NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) DEFAULT 0,
  margin NUMERIC(12,2) DEFAULT 0,
  amount_collected NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  entity_type TEXT,
  entity_id UUID,
  user_id UUID,
  note TEXT,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  user_id UUID,
  due_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS lead_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  user_id UUID,
  comm_type comm_type NOT NULL,
  direction comm_direction NOT NULL,
  summary TEXT,
  duration_mins INTEGER,
  comm_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS post_trip_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  booking_id UUID,
  customer_id UUID,
  destination_snapshot TEXT,
  request_status TEXT DEFAULT 'pending',
  requested_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  hotel_rating INTEGER CHECK (hotel_rating BETWEEN 1 AND 5),
  activity_rating INTEGER CHECK (activity_rating BETWEEN 1 AND 5),
  transfer_rating INTEGER CHECK (transfer_rating BETWEEN 1 AND 5),
  guide_rating INTEGER CHECK (guide_rating BETWEEN 1 AND 5),
  what_went_well TEXT,
  what_could_improve TEXT,
  would_recommend BOOLEAN,
  testimonial_consent BOOLEAN DEFAULT FALSE,
  testimonial_text TEXT,
  feedback_token TEXT UNIQUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  referrer_tenant_id UUID,
  referee_tenant_id UUID,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  referred_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  referrer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  status referral_status DEFAULT 'pending',
  admin_notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS client_health (
  tenant_id UUID PRIMARY KEY,
  health TEXT NOT NULL DEFAULT 'red',
  last_login TIMESTAMPTZ,
  leads_this_week INTEGER DEFAULT 0,
  actions_this_week INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID,
  user_id UUID,
  event_type TEXT NOT NULL,
  engagement_type TEXT,
  channel TEXT,
  template_id UUID,
  message_sent TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  template_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  customer_id UUID,
  quote_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_gstin TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  guests INTEGER,
  rooms INTEGER,
  status quotation_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12,2) DEFAULT 0,
  gst_rate NUMERIC(5,2) DEFAULT 5,
  gst_type TEXT,
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  total_cost_price NUMERIC(12,2) DEFAULT 0,
  total_margin NUMERIC(12,2) DEFAULT 0,
  margin_percentage NUMERIC(5,2) DEFAULT 0,
  place_of_supply TEXT,
  inclusions TEXT,
  exclusions TEXT,
  terms TEXT,
  valid_until DATE,
  version INTEGER DEFAULT 1,
  parent_quote_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID,
  UNIQUE (tenant_id, quote_number, version)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  quotation_id UUID NOT NULL,
  item_type TEXT DEFAULT 'other',
  description TEXT NOT NULL,
  sac_code TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(12,2),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2),
  gst_rate NUMERIC(5,2),
  gst_amount NUMERIC(12,2) DEFAULT 0,
  cost_price NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  quotation_id UUID,
  customer_id UUID,
  invoice_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_gstin TEXT,
  place_of_supply TEXT,
  agency_name TEXT,
  agency_address TEXT,
  agency_gstin TEXT,
  agency_pan TEXT,
  status invoice_status NOT NULL DEFAULT 'draft',
  invoice_type TEXT DEFAULT 'standard',
  financial_year TEXT,
  subtotal NUMERIC(12,2) DEFAULT 0,
  gst_type TEXT,
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  due_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID,
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  description TEXT NOT NULL,
  sac_code TEXT,
  amount NUMERIC(12,2) NOT NULL,
  gst_rate NUMERIC(5,2),
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_id UUID,
  booking_id UUID,
  customer_id UUID,
  payment_method payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category_id UUID REFERENCES expense_categories(id),
  user_id UUID REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  description TEXT NOT NULL,
  vendor TEXT,
  status TEXT DEFAULT 'pending',
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS vendor_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID,
  booking_id UUID,
  booking_service_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  direction TEXT NOT NULL DEFAULT 'agency_to_vendor',
  is_paid BOOLEAN DEFAULT FALSE,
  due_date DATE,
  paid_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS markup_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  markup_pct NUMERIC(5,2),
  markup_fixed NUMERIC(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  acc_type account_type NOT NULL DEFAULT 'current',
  running_balance NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_pct INTEGER DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  coupon_type TEXT DEFAULT 'trial',
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  coupon_id UUID,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  snapshot_before JSONB DEFAULT '{}',
  snapshot_after JSONB DEFAULT '{}',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  customer_id UUID NOT NULL,
  invoice_id UUID,
  quotation_id UUID NOT NULL,
  booking_ref TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  destination TEXT,
  travel_start_date DATE,
  travel_end_date DATE,
  traveler_count INTEGER DEFAULT 1,
  total_cost NUMERIC(12,2) DEFAULT 0,
  total_selling_price NUMERIC(12,2) DEFAULT 0,
  amount_collected NUMERIC(12,2) DEFAULT 0,
  special_requests TEXT,
  internal_notes TEXT,
  status booking_status DEFAULT 'enquiry',
  cancellation_reason TEXT,
  cancellation_notes TEXT,
  cancellation_date DATE,
  refund_status refund_status DEFAULT 'not_applicable',
  refund_due_to_client NUMERIC(12,2) DEFAULT 0,
  supplier_refund_due NUMERIC(12,2) DEFAULT 0,
  supplier_refund_received NUMERIC(12,2) DEFAULT 0,
  agency_cancellation_loss NUMERIC(12,2) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID,
  UNIQUE (tenant_id, booking_ref)
);

CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  supplier_id UUID,
  service_type itinerary_item_type NOT NULL,
  title TEXT NOT NULL,
  service_title TEXT,
  confirmation_number TEXT,
  service_start_date DATE,
  service_end_date DATE,
  room_type TEXT,
  meal_plan TEXT,
  special_requests TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  cost_to_agency NUMERIC(12,2) DEFAULT 0,
  price_to_client NUMERIC(12,2) DEFAULT 0,
  paid_to_supplier_amount NUMERIC(12,2) DEFAULT 0,
  supplier_payment_status TEXT DEFAULT 'unpaid',
  payable_due_date DATE,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  last_payment_date DATE,
  voucher_generated BOOLEAN DEFAULT FALSE,
  voucher_generated_at TIMESTAMPTZ,
  cancellation_status TEXT,
  cancellation_charge NUMERIC(12,2),
  refund_expected NUMERIC(12,2),
  refund_received NUMERIC(12,2),
  refund_received_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  itinerary_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  day_id UUID NOT NULL,
  item_type itinerary_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_val TEXT,
  sort_order INTEGER DEFAULT 0,
  media_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS visa_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  customer_id UUID,
  booking_id UUID,
  traveler_name TEXT NOT NULL,
  applicant_name TEXT,
  destination TEXT,
  visa_type TEXT DEFAULT 'tourist',
  passport_number TEXT,
  passport_holder passport_holder DEFAULT 'customer',
  passport_expiry DATE,
  fee_paid_by TEXT DEFAULT 'customer',
  visa_fee NUMERIC(12,2) DEFAULT 0,
  service_charge NUMERIC(12,2) DEFAULT 0,
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
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS visa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  visa_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  uploaded_by UUID,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  status doc_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS travel_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID,
  customer_id UUID,
  booking_id UUID,
  policy_number TEXT NOT NULL,
  provider TEXT,
  coverage_type TEXT DEFAULT 'basic',
  claim_status TEXT DEFAULT 'none',
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  booking_service_id UUID,
  reason TEXT,
  reason_details TEXT,
  service_status TEXT DEFAULT 'initiated',
  cancellation_charge NUMERIC(12,2) DEFAULT 0,
  refund_amount_client NUMERIC(12,2) DEFAULT 0,
  refund_amount_vendor NUMERIC(12,2) DEFAULT 0,
  refund_received_vendor NUMERIC(12,2) DEFAULT 0,
  refund_gap NUMERIC(12,2) DEFAULT 0,
  cancellation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cancelled_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  assigned_to UUID,
  created_by UUID,
  lead_id UUID,
  booking_id UUID,
  customer_id UUID,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  is_done BOOLEAN DEFAULT FALSE,
  due_date DATE,
  due_time TIME,
  completed_at TIMESTAMPTZ,
  notified_overdue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  created_by UUID,
  lead_id UUID,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  event_type TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  color_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID,
  booking_id UUID,
  lead_id UUID,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  traveler_name TEXT,
  category TEXT DEFAULT 'other',
  storage_bucket TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  included_in_travel_pack BOOLEAN DEFAULT FALSE,
  secure_link TEXT,
  secure_link_expires_at TIMESTAMPTZ,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  booking_id UUID,
  booking_service_id UUID,
  supplier_id UUID,
  voucher_num TEXT,
  guest_names TEXT,
  travel_dates TEXT,
  room_type TEXT,
  meal_plan TEXT,
  special_requests TEXT,
  booking_reference TEXT,
  agency_contact TEXT,
  sent_to_supplier BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  file_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS group_booking_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  member_name TEXT NOT NULL,
  room_sharing TEXT,
  add_ons JSONB DEFAULT '[]',
  base_cost NUMERIC(12,2) DEFAULT 0,
  room_upgrade NUMERIC(12,2) DEFAULT 0,
  add_on_total NUMERIC(12,2) DEFAULT 0,
  per_person_total NUMERIC(12,2) DEFAULT 0,
  invoice_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS miscellaneous_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  booking_id UUID,
  service_type TEXT NOT NULL,
  vendor_name TEXT,
  cost_price NUMERIC(15,2) DEFAULT 0,
  selling_price NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  notif_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  lead_id UUID,
  booking_id UUID,
  task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  lead_id UUID,
  entity_type TEXT,
  entity_id UUID,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  changes JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_stats_cache (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  leads_summary JSONB DEFAULT '{}',
  customers_summary JSONB DEFAULT '{}',
  bookings_summary JSONB DEFAULT '{}',
  finance_summary JSONB DEFAULT '{}',
  tasks_summary JSONB DEFAULT '{}',
  visa_summary JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  rows_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  asset_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  tags JSONB DEFAULT '[]',
  is_global BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  subject TEXT NOT NULL,
  description TEXT,
  ticket_type ticket_type DEFAULT 'support',
  status ticket_status DEFAULT 'open',
  screenshot_url TEXT,
  browser_info TEXT,
  page_url TEXT,
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  user_id UUID,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS customer_merge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  primary_id UUID,
  merged_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_health_cache (
  customer_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  health_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  default_currency TEXT DEFAULT 'INR',
  date_format      TEXT DEFAULT 'DD/MM/YYYY',
  invoice_prefix   TEXT DEFAULT 'INV',
  quotation_prefix TEXT DEFAULT 'QT',
  default_payment_terms TEXT,
  email_footer_text     TEXT,
  auto_followup_days    INTEGER DEFAULT 3,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE TABLE IF NOT EXISTS platform_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  user_id UUID,
  action changelog_action NOT NULL,
  title TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  invoice_number TEXT,
  base_amount NUMERIC(12,2),
  tax_amount NUMERIC(12,2),
  total_amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE,
  payment_type TEXT,
  payment_method TEXT,
  transaction_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id UUID,
  target_user_id UUID,
  target_tenant_id UUID,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  session_token TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,
  source TEXT DEFAULT 'organic',
  features_interested JSONB DEFAULT '[]',
  message TEXT,
  status TEXT DEFAULT 'new',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  alt_phone TEXT,
  contact_person TEXT,
  designation TEXT,
  supplier_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  gst_number TEXT,
  pan_number TEXT,
  bank_name TEXT,
  bank_account_no TEXT,
  bank_ifsc TEXT,
  bank_branch TEXT,
  upi_id TEXT,
  payment_terms TEXT DEFAULT 'net_30',
  credit_limit NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  commission_rate NUMERIC(5,2) DEFAULT 0,
  specialization TEXT,
  destinations_served TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  website TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS agents_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  agency_name TEXT,
  contact_type TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  outstanding_payables NUMERIC(12,2) DEFAULT 0,
  total_business_value NUMERIC(12,2) DEFAULT 0,
  commission_earned NUMERIC(12,2) DEFAULT 0,
  next_payment_due_at DATE,
  payment_terms TEXT,
  preferred_channel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS resource_hub_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  provider TEXT,
  preview_mode TEXT DEFAULT 'iframe',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS vendor_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  title TEXT,
  service_type TEXT,
  file_url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  rate_details JSONB DEFAULT '{}',
  season TEXT,
  destination TEXT,
  valid_from DATE,
  valid_until DATE,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS network_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  company_name TEXT,
  bio TEXT,
  specializations TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  requester_member_id UUID NOT NULL,
  target_member_id UUID,
  requester_tenant_id UUID,
  invite_email TEXT,
  invite_name TEXT,
  connected_at TIMESTAMPTZ,
  note TEXT,
  is_demo_invite BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'accepted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  member_id UUID NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'update',
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  destination_tags TEXT[],
  visibility TEXT DEFAULT 'network',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  quality_disabled BOOLEAN DEFAULT FALSE,
  quality_score NUMERIC(3,2) DEFAULT 0,
  quality_votes INTEGER DEFAULT 0,
  moderation_status TEXT DEFAULT 'clear',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS network_feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  post_id UUID NOT NULL,
  member_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS network_feed_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  post_id UUID NOT NULL,
  member_id UUID NOT NULL,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID,
  UNIQUE (post_id, member_id)
);

CREATE TABLE IF NOT EXISTS network_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sender_id UUID,
  receiver_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);

CREATE TABLE IF NOT EXISTS network_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  posted_by UUID,
  type TEXT DEFAULT 'requirement',
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  budget NUMERIC(12,2),
  urgency TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID
);


CREATE TABLE IF NOT EXISTS network_post_quality_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  post_id UUID,
  rater_member_id UUID NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by UUID,
  UNIQUE (post_id, rater_member_id)
);


-- Section 4: Foreign key constraints (idempotent DO block, DROP + ADD pattern)
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_tenant_id_tenants;
  ALTER TABLE users ADD CONSTRAINT fk_users_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE announcements DROP CONSTRAINT IF EXISTS fk_announcements_created_by_users;
  ALTER TABLE announcements ADD CONSTRAINT fk_announcements_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE announcement_dismissals DROP CONSTRAINT IF EXISTS fk_announcement_dismissals_tenant_id_tenants;
  ALTER TABLE announcement_dismissals ADD CONSTRAINT fk_announcement_dismissals_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE announcement_dismissals DROP CONSTRAINT IF EXISTS fk_announcement_dismissals_announcement_id_announcements;
  ALTER TABLE announcement_dismissals ADD CONSTRAINT fk_announcement_dismissals_announcement_id_announcements FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
  ALTER TABLE announcement_dismissals DROP CONSTRAINT IF EXISTS fk_announcement_dismissals_user_id_users;
  ALTER TABLE announcement_dismissals ADD CONSTRAINT fk_announcement_dismissals_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_tenant_id_tenants;
  ALTER TABLE customers ADD CONSTRAINT fk_customers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_referred_by_customers;
  ALTER TABLE customers ADD CONSTRAINT fk_customers_referred_by_customers FOREIGN KEY (referred_by) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_created_by_users;
  ALTER TABLE customers ADD CONSTRAINT fk_customers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE associated_travelers DROP CONSTRAINT IF EXISTS fk_associated_travelers_tenant_id_tenants;
  ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE associated_travelers DROP CONSTRAINT IF EXISTS fk_associated_travelers_customer_id_customers;
  ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  ALTER TABLE associated_travelers DROP CONSTRAINT IF EXISTS fk_associated_travelers_created_by_users;
  ALTER TABLE associated_travelers ADD CONSTRAINT fk_associated_travelers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_tenant_id_tenants;
  ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_customer_id_customers;
  ALTER TABLE leads ADD CONSTRAINT fk_leads_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_assigned_to_users;
  ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE lead_notes DROP CONSTRAINT IF EXISTS fk_lead_notes_tenant_id_tenants;
  ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE lead_notes DROP CONSTRAINT IF EXISTS fk_lead_notes_lead_id_leads;
  ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
  ALTER TABLE lead_notes DROP CONSTRAINT IF EXISTS fk_lead_notes_user_id_users;
  ALTER TABLE lead_notes ADD CONSTRAINT fk_lead_notes_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE lead_followups DROP CONSTRAINT IF EXISTS fk_lead_followups_tenant_id_tenants;
  ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE lead_followups DROP CONSTRAINT IF EXISTS fk_lead_followups_lead_id_leads;
  ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
  ALTER TABLE lead_followups DROP CONSTRAINT IF EXISTS fk_lead_followups_user_id_users;
  ALTER TABLE lead_followups ADD CONSTRAINT fk_lead_followups_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE lead_attachments DROP CONSTRAINT IF EXISTS fk_lead_attachments_tenant_id_tenants;
  ALTER TABLE lead_attachments ADD CONSTRAINT fk_lead_attachments_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE lead_attachments DROP CONSTRAINT IF EXISTS fk_lead_attachments_lead_id_leads;
  ALTER TABLE lead_attachments ADD CONSTRAINT fk_lead_attachments_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

  ALTER TABLE lead_documents DROP CONSTRAINT IF EXISTS fk_lead_documents_tenant_id_tenants;
  ALTER TABLE lead_documents ADD CONSTRAINT fk_lead_documents_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE lead_documents DROP CONSTRAINT IF EXISTS fk_lead_documents_lead_id_leads;
  ALTER TABLE lead_documents ADD CONSTRAINT fk_lead_documents_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

  ALTER TABLE lead_communications DROP CONSTRAINT IF EXISTS fk_lead_communications_tenant_id_tenants;
  ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE lead_communications DROP CONSTRAINT IF EXISTS fk_lead_communications_lead_id_leads;
  ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
  ALTER TABLE lead_communications DROP CONSTRAINT IF EXISTS fk_lead_communications_user_id_users;
  ALTER TABLE lead_communications ADD CONSTRAINT fk_lead_communications_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE post_trip_feedback DROP CONSTRAINT IF EXISTS fk_post_trip_feedback_tenant_id_tenants;
  ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE post_trip_feedback DROP CONSTRAINT IF EXISTS fk_post_trip_feedback_lead_id_leads;
  ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE post_trip_feedback DROP CONSTRAINT IF EXISTS fk_post_trip_feedback_booking_id_bookings;
  ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE post_trip_feedback DROP CONSTRAINT IF EXISTS fk_post_trip_feedback_customer_id_customers;
  ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE post_trip_feedback DROP CONSTRAINT IF EXISTS fk_post_trip_feedback_created_by_users;
  ALTER TABLE post_trip_feedback ADD CONSTRAINT fk_post_trip_feedback_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE referrals DROP CONSTRAINT IF EXISTS fk_referrals_tenant_id_tenants;
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE referrals DROP CONSTRAINT IF EXISTS fk_referrals_referrer_tenant_id_tenants;
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referrer_tenant_id_tenants FOREIGN KEY (referrer_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  ALTER TABLE referrals DROP CONSTRAINT IF EXISTS fk_referrals_referee_tenant_id_tenants;
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_referee_tenant_id_tenants FOREIGN KEY (referee_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE client_health DROP CONSTRAINT IF EXISTS fk_client_health_tenant_id_tenants;
  ALTER TABLE client_health ADD CONSTRAINT fk_client_health_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE engagement_log DROP CONSTRAINT IF EXISTS fk_engagement_log_tenant_id_tenants;
  ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE engagement_log DROP CONSTRAINT IF EXISTS fk_engagement_log_customer_id_customers;
  ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE engagement_log DROP CONSTRAINT IF EXISTS fk_engagement_log_user_id_users;
  ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE engagement_log DROP CONSTRAINT IF EXISTS fk_engagement_log_template_id_message_templates;
  ALTER TABLE engagement_log ADD CONSTRAINT fk_engagement_log_template_id_message_templates FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL;

  ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS fk_message_templates_tenant_id_tenants;
  ALTER TABLE message_templates ADD CONSTRAINT fk_message_templates_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_tenant_id_tenants;
  ALTER TABLE quotations ADD CONSTRAINT fk_quotations_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_lead_id_leads;
  ALTER TABLE quotations ADD CONSTRAINT fk_quotations_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_customer_id_customers;
  ALTER TABLE quotations ADD CONSTRAINT fk_quotations_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_parent_quote_id_quotations;
  ALTER TABLE quotations ADD CONSTRAINT fk_quotations_parent_quote_id_quotations FOREIGN KEY (parent_quote_id) REFERENCES quotations(id) ON DELETE SET NULL;
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_created_by_users;
  ALTER TABLE quotations ADD CONSTRAINT fk_quotations_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE quotation_items DROP CONSTRAINT IF EXISTS fk_quotation_items_tenant_id_tenants;
  ALTER TABLE quotation_items ADD CONSTRAINT fk_quotation_items_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE quotation_items DROP CONSTRAINT IF EXISTS fk_quotation_items_quotation_id_quotations;
  ALTER TABLE quotation_items ADD CONSTRAINT fk_quotation_items_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;

  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_tenant_id_tenants;
  ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_lead_id_leads;
  ALTER TABLE invoices ADD CONSTRAINT fk_invoices_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_quotation_id_quotations;
  ALTER TABLE invoices ADD CONSTRAINT fk_invoices_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_customer_id_customers;
  ALTER TABLE invoices ADD CONSTRAINT fk_invoices_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_created_by_users;
  ALTER TABLE invoices ADD CONSTRAINT fk_invoices_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS fk_invoice_items_tenant_id_tenants;
  ALTER TABLE invoice_items ADD CONSTRAINT fk_invoice_items_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS fk_invoice_items_invoice_id_invoices;
  ALTER TABLE invoice_items ADD CONSTRAINT fk_invoice_items_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

  ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_tenant_id_tenants;
  ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_invoice_id_invoices;
  ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_booking_id_bookings;
  ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_customer_id_customers;
  ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS fk_payment_transactions_recorded_by_users;
  ALTER TABLE payment_transactions ADD CONSTRAINT fk_payment_transactions_recorded_by_users FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_tenant_id_tenants;
  ALTER TABLE expenses ADD CONSTRAINT fk_expenses_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE expense_categories DROP CONSTRAINT IF EXISTS fk_expense_categories_tenant_id_tenants;
  ALTER TABLE expense_categories ADD CONSTRAINT fk_expense_categories_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE vendor_ledger DROP CONSTRAINT IF EXISTS fk_vendor_ledger_tenant_id_tenants;
  ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE vendor_ledger DROP CONSTRAINT IF EXISTS fk_vendor_ledger_supplier_id_suppliers;
  ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  ALTER TABLE vendor_ledger DROP CONSTRAINT IF EXISTS fk_vendor_ledger_booking_id_bookings;
  ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE vendor_ledger DROP CONSTRAINT IF EXISTS fk_vendor_ledger_booking_service_id_booking_services;
  ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL;
  ALTER TABLE vendor_ledger DROP CONSTRAINT IF EXISTS fk_vendor_ledger_created_by_users;
  ALTER TABLE vendor_ledger ADD CONSTRAINT fk_vendor_ledger_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE markup_presets DROP CONSTRAINT IF EXISTS fk_markup_presets_tenant_id_tenants;
  ALTER TABLE markup_presets ADD CONSTRAINT fk_markup_presets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS fk_bank_accounts_tenant_id_tenants;
  ALTER TABLE bank_accounts ADD CONSTRAINT fk_bank_accounts_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE coupons DROP CONSTRAINT IF EXISTS fk_coupons_created_by_users;
  ALTER TABLE coupons DROP CONSTRAINT IF EXISTS fk_c_user;
  ALTER TABLE coupons ADD CONSTRAINT fk_coupons_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE coupon_usage_logs DROP CONSTRAINT IF EXISTS fk_coupon_usage_logs_tenant_id_tenants;
  ALTER TABLE coupon_usage_logs DROP CONSTRAINT IF EXISTS fk_cul_tenant;
  ALTER TABLE coupon_usage_logs ADD CONSTRAINT fk_coupon_usage_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE coupon_usage_logs DROP CONSTRAINT IF EXISTS fk_coupon_usage_logs_coupon_id_coupons;
  ALTER TABLE coupon_usage_logs ADD CONSTRAINT fk_coupon_usage_logs_coupon_id_coupons FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

  ALTER TABLE financial_audit_log DROP CONSTRAINT IF EXISTS fk_financial_audit_log_tenant_id_tenants;
  ALTER TABLE financial_audit_log ADD CONSTRAINT fk_financial_audit_log_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE financial_audit_log DROP CONSTRAINT IF EXISTS fk_financial_audit_log_user_id_users;
  ALTER TABLE financial_audit_log ADD CONSTRAINT fk_financial_audit_log_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_tenant_id_tenants;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_lead_id_leads;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_customer_id_customers;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_invoice_id_invoices;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_quotation_id_quotations;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_quotation_id_quotations FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_bookings_created_by_users;
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE booking_services DROP CONSTRAINT IF EXISTS fk_booking_services_tenant_id_tenants;
  ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE booking_services DROP CONSTRAINT IF EXISTS fk_booking_services_booking_id_bookings;
  ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  ALTER TABLE booking_services DROP CONSTRAINT IF EXISTS fk_booking_services_supplier_id_suppliers;
  ALTER TABLE booking_services ADD CONSTRAINT fk_booking_services_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

  ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS fk_itineraries_tenant_id_tenants;
  ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS fk_itineraries_lead_id_leads;
  ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE itineraries DROP CONSTRAINT IF EXISTS fk_itineraries_customer_id_customers;
  ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

  ALTER TABLE itinerary_days DROP CONSTRAINT IF EXISTS fk_itinerary_days_tenant_id_tenants;
  ALTER TABLE itinerary_days ADD CONSTRAINT fk_itinerary_days_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE itinerary_days DROP CONSTRAINT IF EXISTS fk_itinerary_days_itinerary_id_itineraries;
  ALTER TABLE itinerary_days ADD CONSTRAINT fk_itinerary_days_itinerary_id_itineraries FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE;

  ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS fk_itinerary_items_tenant_id_tenants;
  ALTER TABLE itinerary_items ADD CONSTRAINT fk_itinerary_items_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE itinerary_items DROP CONSTRAINT IF EXISTS fk_itinerary_items_day_id_itinerary_days;
  ALTER TABLE itinerary_items ADD CONSTRAINT fk_itinerary_items_day_id_itinerary_days FOREIGN KEY (day_id) REFERENCES itinerary_days(id) ON DELETE CASCADE;

  ALTER TABLE visa_tracking DROP CONSTRAINT IF EXISTS fk_visa_tracking_tenant_id_tenants;
  ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE visa_tracking DROP CONSTRAINT IF EXISTS fk_visa_tracking_lead_id_leads;
  ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE visa_tracking DROP CONSTRAINT IF EXISTS fk_visa_tracking_customer_id_customers;
  ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE visa_tracking DROP CONSTRAINT IF EXISTS fk_visa_tracking_assigned_to_users;
  ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE visa_tracking DROP CONSTRAINT IF EXISTS fk_visa_tracking_booking_id_bookings;
  ALTER TABLE visa_tracking ADD CONSTRAINT fk_visa_tracking_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

  ALTER TABLE visa_documents DROP CONSTRAINT IF EXISTS fk_visa_documents_tenant_id_tenants;
  ALTER TABLE visa_documents ADD CONSTRAINT fk_visa_documents_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE visa_documents DROP CONSTRAINT IF EXISTS fk_visa_documents_visa_tracking_id_visa_tracking;
  ALTER TABLE visa_documents DROP CONSTRAINT IF EXISTS fk_visa_documents_visa_id_visa_tracking;
  ALTER TABLE visa_documents ADD CONSTRAINT fk_visa_documents_visa_id_visa_tracking FOREIGN KEY (visa_id) REFERENCES visa_tracking(id) ON DELETE CASCADE;
  ALTER TABLE visa_documents DROP CONSTRAINT IF EXISTS uni_visa_track_doc;
  ALTER TABLE visa_documents ADD CONSTRAINT uni_visa_track_doc UNIQUE (visa_id, document_type);

  ALTER TABLE travel_insurance_policies DROP CONSTRAINT IF EXISTS fk_travel_insurance_policies_tenant_id_tenants;
  ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE travel_insurance_policies DROP CONSTRAINT IF EXISTS fk_travel_insurance_policies_lead_id_leads;
  ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE travel_insurance_policies DROP CONSTRAINT IF EXISTS fk_travel_insurance_policies_customer_id_customers;
  ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE travel_insurance_policies DROP CONSTRAINT IF EXISTS fk_travel_insurance_policies_booking_id_bookings;
  ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE travel_insurance_policies DROP CONSTRAINT IF EXISTS fk_travel_insurance_policies_created_by_users;
  ALTER TABLE travel_insurance_policies ADD CONSTRAINT fk_travel_insurance_policies_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE cancellations DROP CONSTRAINT IF EXISTS fk_cancellations_tenant_id_tenants;
  ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE cancellations DROP CONSTRAINT IF EXISTS fk_cancellations_booking_id_bookings;
  ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  ALTER TABLE cancellations DROP CONSTRAINT IF EXISTS fk_cancellations_booking_service_id_booking_services;
  ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL;
  ALTER TABLE cancellations DROP CONSTRAINT IF EXISTS fk_cancellations_cancelled_by_users;
  ALTER TABLE cancellations ADD CONSTRAINT fk_cancellations_cancelled_by_users FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_tenant_id_tenants;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_assigned_to_users;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_to_users FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_created_by_users;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_lead_id_leads;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_booking_id_bookings;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_customer_id_customers;
  ALTER TABLE tasks ADD CONSTRAINT fk_tasks_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

  ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS fk_calendar_events_tenant_id_tenants;
  ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS fk_calendar_events_lead_id_leads;
  ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS fk_calendar_events_user_id_users;
  ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS fk_calendar_events_created_by_users;
  ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_tenant_id_tenants;
  ALTER TABLE documents ADD CONSTRAINT fk_documents_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_customer_id_customers;
  ALTER TABLE documents ADD CONSTRAINT fk_documents_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_booking_id_bookings;
  ALTER TABLE documents ADD CONSTRAINT fk_documents_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_lead_id_leads;
  ALTER TABLE documents ADD CONSTRAINT fk_documents_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_uploaded_by_users;
  ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by_users FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_tenant_id_tenants;
  ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_booking_id_bookings;
  ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_booking_service_id_booking_services;
  ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_booking_service_id_booking_services FOREIGN KEY (booking_service_id) REFERENCES booking_services(id) ON DELETE SET NULL;
  ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_supplier_id_suppliers;
  ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_supplier_id_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS fk_vouchers_created_by_users;
  ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE group_booking_members DROP CONSTRAINT IF EXISTS fk_group_booking_members_tenant_id_tenants;
  ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE group_booking_members DROP CONSTRAINT IF EXISTS fk_group_booking_members_booking_id_bookings;
  ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  ALTER TABLE group_booking_members DROP CONSTRAINT IF EXISTS fk_group_booking_members_invoice_id_invoices;
  ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_invoice_id_invoices FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
  ALTER TABLE group_booking_members DROP CONSTRAINT IF EXISTS fk_group_booking_members_created_by_users;
  ALTER TABLE group_booking_members ADD CONSTRAINT fk_group_booking_members_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE miscellaneous_services DROP CONSTRAINT IF EXISTS fk_miscellaneous_services_tenant_id_tenants;
  ALTER TABLE miscellaneous_services ADD CONSTRAINT fk_miscellaneous_services_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE miscellaneous_services DROP CONSTRAINT IF EXISTS fk_miscellaneous_services_booking_id_bookings;
  ALTER TABLE miscellaneous_services ADD CONSTRAINT fk_miscellaneous_services_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_tenant_id_tenants;
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user_id_users;
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_lead_id_leads;
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_booking_id_bookings;
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_booking_id_bookings FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_task_id_tasks;
  ALTER TABLE notifications ADD CONSTRAINT fk_notifications_task_id_tasks FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

  ALTER TABLE workspace_messages DROP CONSTRAINT IF EXISTS fk_workspace_messages_tenant_id_tenants;
  ALTER TABLE workspace_messages ADD CONSTRAINT fk_workspace_messages_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE workspace_messages DROP CONSTRAINT IF EXISTS fk_workspace_messages_sender_id_users;
  ALTER TABLE workspace_messages ADD CONSTRAINT fk_workspace_messages_sender_id_users FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS fk_push_subscriptions_tenant_id_tenants;
  ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_subscriptions_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS fk_push_subscriptions_user_id_users;
  ALTER TABLE push_subscriptions ADD CONSTRAINT fk_push_subscriptions_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_tenant_id_tenants;
  ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_id_users;
  ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_lead_id_leads;
  ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_lead_id_leads FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

  ALTER TABLE dashboard_stats_cache DROP CONSTRAINT IF EXISTS fk_dashboard_stats_cache_tenant_id_tenants;
  ALTER TABLE dashboard_stats_cache ADD CONSTRAINT fk_dashboard_stats_cache_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE import_logs DROP CONSTRAINT IF EXISTS fk_import_logs_tenant_id_tenants;
  ALTER TABLE import_logs ADD CONSTRAINT fk_import_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE master_assets DROP CONSTRAINT IF EXISTS fk_master_assets_tenant_id_tenants;
  ALTER TABLE master_assets ADD CONSTRAINT fk_master_assets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE master_assets DROP CONSTRAINT IF EXISTS fk_master_assets_created_by_users;
  ALTER TABLE master_assets ADD CONSTRAINT fk_master_assets_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS fk_tenant_settings_tenant_id_tenants;
  ALTER TABLE tenant_settings ADD CONSTRAINT fk_tenant_settings_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS fk_support_tickets_tenant_id_tenants;
  ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS fk_support_tickets_user_id_users;
  ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS fk_support_tickets_resolved_by_users;
  ALTER TABLE support_tickets ADD CONSTRAINT fk_support_tickets_resolved_by_users FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE ticket_replies DROP CONSTRAINT IF EXISTS fk_ticket_replies_tenant_id_tenants;
  ALTER TABLE ticket_replies ADD CONSTRAINT fk_ticket_replies_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE ticket_replies DROP CONSTRAINT IF EXISTS fk_ticket_replies_ticket_id_support_tickets;
  ALTER TABLE ticket_replies ADD CONSTRAINT fk_ticket_replies_ticket_id_support_tickets FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
  ALTER TABLE ticket_replies DROP CONSTRAINT IF EXISTS fk_ticket_replies_user_id_users;
  ALTER TABLE ticket_replies ADD CONSTRAINT fk_ticket_replies_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE customer_merge_logs DROP CONSTRAINT IF EXISTS fk_customer_merge_logs_tenant_id_tenants;
  ALTER TABLE customer_merge_logs ADD CONSTRAINT fk_customer_merge_logs_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE customer_merge_logs DROP CONSTRAINT IF EXISTS fk_customer_merge_logs_primary_id_customers;
  ALTER TABLE customer_merge_logs ADD CONSTRAINT fk_customer_merge_logs_primary_id_customers FOREIGN KEY (primary_id) REFERENCES customers(id) ON DELETE SET NULL;

  ALTER TABLE customer_health_cache DROP CONSTRAINT IF EXISTS fk_customer_health_cache_customer_id_customers;
  ALTER TABLE customer_health_cache ADD CONSTRAINT fk_customer_health_cache_customer_id_customers FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
  ALTER TABLE customer_health_cache DROP CONSTRAINT IF EXISTS fk_customer_health_cache_tenant_id_tenants;
  ALTER TABLE customer_health_cache ADD CONSTRAINT fk_customer_health_cache_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE platform_settings DROP CONSTRAINT IF EXISTS fk_platform_settings_updated_by_users;
  ALTER TABLE platform_settings DROP CONSTRAINT IF EXISTS fk_ps_user;
  ALTER TABLE platform_settings ADD CONSTRAINT fk_platform_settings_updated_by_users FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE platform_changelog DROP CONSTRAINT IF EXISTS fk_platform_changelog_tenant_id_tenants;
  ALTER TABLE platform_changelog DROP CONSTRAINT IF EXISTS fk_pcl_tenant;
  ALTER TABLE platform_changelog ADD CONSTRAINT fk_platform_changelog_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  ALTER TABLE platform_changelog DROP CONSTRAINT IF EXISTS fk_platform_changelog_user_id_users;
  ALTER TABLE platform_changelog DROP CONSTRAINT IF EXISTS fk_pcl_user;
  ALTER TABLE platform_changelog ADD CONSTRAINT fk_platform_changelog_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE platform_invoices DROP CONSTRAINT IF EXISTS fk_platform_invoices_tenant_id_tenants;
  ALTER TABLE platform_invoices DROP CONSTRAINT IF EXISTS fk_pi_tenant;
  ALTER TABLE platform_invoices ADD CONSTRAINT fk_platform_invoices_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE platform_payments DROP CONSTRAINT IF EXISTS fk_platform_payments_tenant_id_tenants;
  ALTER TABLE platform_payments DROP CONSTRAINT IF EXISTS fk_pp_tenant;
  ALTER TABLE platform_payments ADD CONSTRAINT fk_platform_payments_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_impersonation_sessions_super_admin_user_id_users;
  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_is_sa;
  ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_impersonation_sessions_super_admin_user_id_users FOREIGN KEY (super_admin_user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_impersonation_sessions_target_user_id_users;
  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_is_tu;
  ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_impersonation_sessions_target_user_id_users FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_impersonation_sessions_target_tenant_id_tenants;
  ALTER TABLE impersonation_sessions DROP CONSTRAINT IF EXISTS fk_is_tt;
  ALTER TABLE impersonation_sessions ADD CONSTRAINT fk_impersonation_sessions_target_tenant_id_tenants FOREIGN KEY (target_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_tenant_id_tenants;
  ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS fk_suppliers_created_by_users;
  ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE agents_directory DROP CONSTRAINT IF EXISTS fk_agents_directory_tenant_id_tenants;
  ALTER TABLE agents_directory ADD CONSTRAINT fk_agents_directory_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE offers DROP CONSTRAINT IF EXISTS fk_offers_tenant_id_tenants;
  ALTER TABLE offers ADD CONSTRAINT fk_offers_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);

  ALTER TABLE resource_hub_links DROP CONSTRAINT IF EXISTS fk_resource_hub_links_tenant_id_tenants;
  ALTER TABLE resource_hub_links ADD CONSTRAINT fk_resource_hub_links_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE resource_hub_links DROP CONSTRAINT IF EXISTS fk_resource_hub_links_created_by_users;
  ALTER TABLE resource_hub_links ADD CONSTRAINT fk_resource_hub_links_created_by_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE vendor_rate_cards DROP CONSTRAINT IF EXISTS fk_vendor_rate_cards_tenant_id_tenants;
  ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE vendor_rate_cards DROP CONSTRAINT IF EXISTS fk_vendor_rate_cards_vendor_id_suppliers;
  ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_vendor_id_suppliers FOREIGN KEY (vendor_id) REFERENCES suppliers(id) ON DELETE CASCADE;
  ALTER TABLE vendor_rate_cards DROP CONSTRAINT IF EXISTS fk_vendor_rate_cards_uploaded_by_users;
  ALTER TABLE vendor_rate_cards ADD CONSTRAINT fk_vendor_rate_cards_uploaded_by_users FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE network_members DROP CONSTRAINT IF EXISTS fk_network_members_tenant_id_tenants;
  ALTER TABLE network_members ADD CONSTRAINT fk_network_members_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_members DROP CONSTRAINT IF EXISTS fk_network_members_user_id_users;
  ALTER TABLE network_members ADD CONSTRAINT fk_network_members_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE network_connections DROP CONSTRAINT IF EXISTS fk_network_connections_tenant_id_tenants;
  ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_connections DROP CONSTRAINT IF EXISTS fk_network_connections_requester_member_id_network_members;
  ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_requester_member_id_network_members FOREIGN KEY (requester_member_id) REFERENCES network_members(id) ON DELETE CASCADE;
  ALTER TABLE network_connections DROP CONSTRAINT IF EXISTS fk_network_connections_target_member_id_network_members;
  ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_target_member_id_network_members FOREIGN KEY (target_member_id) REFERENCES network_members(id) ON DELETE SET NULL;
  ALTER TABLE network_connections DROP CONSTRAINT IF EXISTS fk_network_connections_requester_tenant_id_tenants;
  ALTER TABLE network_connections ADD CONSTRAINT fk_network_connections_requester_tenant_id_tenants FOREIGN KEY (requester_tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

  ALTER TABLE network_feed_posts DROP CONSTRAINT IF EXISTS fk_network_feed_posts_tenant_id_tenants;
  ALTER TABLE network_feed_posts ADD CONSTRAINT fk_network_feed_posts_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_feed_posts DROP CONSTRAINT IF EXISTS fk_network_feed_posts_member_id_network_members;
  ALTER TABLE network_feed_posts ADD CONSTRAINT fk_network_feed_posts_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE;

  ALTER TABLE network_feed_comments DROP CONSTRAINT IF EXISTS fk_network_feed_comments_tenant_id_tenants;
  ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_feed_comments DROP CONSTRAINT IF EXISTS fk_network_feed_comments_post_id_network_feed_posts;
  ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE;
  ALTER TABLE network_feed_comments DROP CONSTRAINT IF EXISTS fk_network_feed_comments_member_id_network_members;
  ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE;
  ALTER TABLE network_feed_comments DROP CONSTRAINT IF EXISTS fk_network_feed_comments_parent_comment_id_network_feed_comments;
  ALTER TABLE network_feed_comments ADD CONSTRAINT fk_network_feed_comments_parent_comment_id_network_feed_comments FOREIGN KEY (parent_comment_id) REFERENCES network_feed_comments(id) ON DELETE CASCADE;

  ALTER TABLE network_feed_reactions DROP CONSTRAINT IF EXISTS fk_network_feed_reactions_tenant_id_tenants;
  ALTER TABLE network_feed_reactions ADD CONSTRAINT fk_network_feed_reactions_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_feed_reactions DROP CONSTRAINT IF EXISTS fk_network_feed_reactions_post_id_network_feed_posts;
  ALTER TABLE network_feed_reactions ADD CONSTRAINT fk_network_feed_reactions_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE;
  ALTER TABLE network_feed_reactions DROP CONSTRAINT IF EXISTS fk_network_feed_reactions_member_id_network_members;
  ALTER TABLE network_feed_reactions ADD CONSTRAINT fk_network_feed_reactions_member_id_network_members FOREIGN KEY (member_id) REFERENCES network_members(id) ON DELETE CASCADE;

  ALTER TABLE network_messages DROP CONSTRAINT IF EXISTS fk_network_messages_tenant_id_tenants;
  ALTER TABLE network_messages ADD CONSTRAINT fk_network_messages_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_messages DROP CONSTRAINT IF EXISTS fk_network_messages_sender_id_users;
  ALTER TABLE network_messages ADD CONSTRAINT fk_network_messages_sender_id_users FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE network_messages DROP CONSTRAINT IF EXISTS fk_network_messages_receiver_id_users;
  ALTER TABLE network_messages ADD CONSTRAINT fk_network_messages_receiver_id_users FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL;

  ALTER TABLE network_opportunities DROP CONSTRAINT IF EXISTS fk_network_opportunities_tenant_id_tenants;
  ALTER TABLE network_opportunities ADD CONSTRAINT fk_network_opportunities_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_opportunities DROP CONSTRAINT IF EXISTS fk_network_opportunities_posted_by_network_members;
  ALTER TABLE network_opportunities ADD CONSTRAINT fk_network_opportunities_posted_by_network_members FOREIGN KEY (posted_by) REFERENCES network_members(id) ON DELETE SET NULL;

  ALTER TABLE network_post_quality_ratings DROP CONSTRAINT IF EXISTS fk_network_post_quality_ratings_tenant_id_tenants;
  ALTER TABLE network_post_quality_ratings ADD CONSTRAINT fk_network_post_quality_ratings_tenant_id_tenants FOREIGN KEY (tenant_id) REFERENCES tenants(id);
  ALTER TABLE network_post_quality_ratings DROP CONSTRAINT IF EXISTS fk_network_post_quality_ratings_post_id_network_feed_posts;
  ALTER TABLE network_post_quality_ratings ADD CONSTRAINT fk_network_post_quality_ratings_post_id_network_feed_posts FOREIGN KEY (post_id) REFERENCES network_feed_posts(id) ON DELETE CASCADE;
  ALTER TABLE network_post_quality_ratings DROP CONSTRAINT IF EXISTS fk_network_post_quality_ratings_rater_member_id_network_members;
  ALTER TABLE network_post_quality_ratings ADD CONSTRAINT fk_network_post_quality_ratings_rater_member_id_network_members FOREIGN KEY (rater_member_id) REFERENCES network_members(id) ON DELETE CASCADE;
END $$;

-- Section 5: Database functions (auth_tenant_id, is_super_admin, set_updated_at, all RPCs)
DROP FUNCTION IF EXISTS public.auth_tenant_id() CASCADE;

CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::UUID;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION find_duplicate_phones(p_tenant_id UUID)
RETURNS TABLE(phone TEXT, customer_ids UUID[])
LANGUAGE sql
STABLE
AS $$
  SELECT c.phone, array_agg(c.id ORDER BY c.created_at)
  FROM customers c
  WHERE c.tenant_id = p_tenant_id
    AND c.deleted_at IS NULL
    AND c.phone IS NOT NULL
    AND btrim(c.phone) <> ''
  GROUP BY c.phone
  HAVING COUNT(*) > 1;
$$;

CREATE OR REPLACE FUNCTION get_monthly_pnl(p_tenant_id UUID, p_year INT, p_month INT)
RETURNS TABLE(total_revenue NUMERIC, total_expenses NUMERIC, net_pnl NUMERIC)
LANGUAGE sql
STABLE
AS $$
  WITH revenue AS (
    SELECT COALESCE(SUM(i.amount_paid), 0)::NUMERIC AS amount
    FROM invoices i
    WHERE i.tenant_id = p_tenant_id
      AND i.deleted_at IS NULL
      AND i.status IN ('paid', 'partially_paid')
      AND EXTRACT(YEAR FROM i.created_at)::INT = p_year
      AND EXTRACT(MONTH FROM i.created_at)::INT = p_month
  ),
  expense_total AS (
    SELECT COALESCE(SUM(e.amount), 0)::NUMERIC AS amount
    FROM expenses e
    WHERE e.tenant_id = p_tenant_id
      AND e.deleted_at IS NULL
      AND EXTRACT(YEAR FROM e.expense_date)::INT = p_year
      AND EXTRACT(MONTH FROM e.expense_date)::INT = p_month
  )
  SELECT revenue.amount, expense_total.amount, revenue.amount - expense_total.amount
  FROM revenue, expense_total;
$$;

CREATE OR REPLACE FUNCTION get_tenant_storage_size(p_tenant_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(d.file_size_bytes), 0)::BIGINT
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.deleted_at IS NULL;
$$;

DROP FUNCTION IF EXISTS get_booking_hub(UUID, UUID);
CREATE OR REPLACE FUNCTION get_booking_hub(p_booking_id UUID, p_tenant_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
AS $$
  WITH selected_booking AS (
    SELECT b.*
    FROM bookings b
    WHERE b.id = p_booking_id
      AND b.tenant_id = p_tenant_id
      AND b.deleted_at IS NULL
    LIMIT 1
  )
  SELECT json_build_object(
    'booking', COALESCE((SELECT row_to_json(b) FROM selected_booking b), 'null'::JSON),
    'customer', COALESCE((
      SELECT row_to_json(c)
      FROM customers c
      JOIN selected_booking b ON b.customer_id = c.id
      WHERE c.tenant_id = p_tenant_id
        AND c.deleted_at IS NULL
    ), 'null'::JSON),
    'booking_services', COALESCE((
      SELECT json_agg(bs ORDER BY bs.created_at)
      FROM booking_services bs
      WHERE bs.booking_id = p_booking_id
        AND bs.tenant_id = p_tenant_id
        AND bs.deleted_at IS NULL
    ), '[]'::JSON),
    'payment_transactions', COALESCE((
      SELECT json_agg(pt ORDER BY pt.created_at)
      FROM payment_transactions pt
      WHERE pt.booking_id = p_booking_id
        AND pt.tenant_id = p_tenant_id
        AND pt.deleted_at IS NULL
    ), '[]'::JSON),
    'vouchers', COALESCE((
      SELECT json_agg(v ORDER BY v.created_at)
      FROM vouchers v
      WHERE v.booking_id = p_booking_id
        AND v.tenant_id = p_tenant_id
        AND v.deleted_at IS NULL
    ), '[]'::JSON),
    'documents', COALESCE((
      SELECT json_agg(d ORDER BY d.created_at)
      FROM documents d
      WHERE d.booking_id = p_booking_id
        AND d.tenant_id = p_tenant_id
        AND d.deleted_at IS NULL
    ), '[]'::JSON),
    'cancellations', COALESCE((
      SELECT json_agg(cn ORDER BY cn.created_at)
      FROM cancellations cn
      WHERE cn.booking_id = p_booking_id
        AND cn.tenant_id = p_tenant_id
        AND cn.deleted_at IS NULL
    ), '[]'::JSON)
  );
$$;

CREATE OR REPLACE FUNCTION sync_auth_user_to_public_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_id,
    email,
    name,
    tenant_id,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (NEW.raw_app_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_app_meta_data->>'role', 'staff')::user_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- Section 6: Triggers (set_updated_at trigger on all relevant tables, auth.users sync trigger)
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', table_record.table_name);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      table_record.table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, auth_id, email, name, tenant_id, role, is_active, created_at
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (NEW.raw_app_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_app_meta_data->>'role', 'staff')::user_role,
    true,
    now()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    role = EXCLUDED.role,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS sync_auth_users_to_public_users ON auth.users;
CREATE TRIGGER sync_auth_users_to_public_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_auth_user_to_public_user();

-- Section 7: Row Level Security (ENABLE RLS + tenant_access policies)
DO $$
DECLARE
  tenant_table TEXT;
  platform_table TEXT;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'users',
    'announcement_dismissals',
    'customers',
    'associated_travelers',
    'leads',
    'lead_notes',
    'lead_followups',
    'lead_attachments',
    'lead_documents',
    'lead_communications',
    'post_trip_feedback',
    'referrals',
    'client_health',
    'engagement_log',
    'message_templates',
    'quotations',
    'quotation_items',
    'invoices',
    'invoice_items',
    'payment_transactions',
    'expenses',
    'expense_categories',
    'vendor_ledger',
    'markup_presets',
    'bank_accounts',
    'coupon_usage_logs',
    'financial_audit_log',
    'bookings',
    'booking_services',
    'itineraries',
    'itinerary_days',
    'itinerary_items',
    'visa_tracking',
    'visa_documents',
    'travel_insurance_policies',
    'cancellations',
    'tasks',
    'calendar_events',
    'documents',
    'vouchers',
    'group_booking_members',
    'miscellaneous_services',
    'notifications',
    'workspace_messages',
    'push_subscriptions',
    'activity_logs',
    'import_logs',
    'master_assets',
    'tenant_settings',
    'support_tickets',
    'ticket_replies',
    'customer_merge_logs',
    'customer_health_cache',
    'suppliers',
    'agents_directory',
    'offers',
    'resource_hub_links',
    'vendor_rate_cards',
    'network_members',
    'network_connections',
    'network_feed_posts',
    'network_feed_comments',
    'network_feed_reactions',
    'network_messages',
    'network_opportunities',
    'network_post_quality_ratings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS tenant_access ON public.%I', tenant_table);
    EXECUTE format('CREATE POLICY tenant_access ON public.%I USING (tenant_id = auth_tenant_id())', tenant_table);
  END LOOP;

  FOREACH platform_table IN ARRAY ARRAY[
    'plans',
    'tenants',
    'sales_requests',
    'platform_settings',
    'platform_changelog',
    'platform_invoices',
    'platform_payments',
    'platform_prospects',
    'announcements',
    'coupons',
    'dashboard_stats_cache',
    'security_audit_logs',
    'impersonation_sessions'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_access ON public.%I', platform_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', platform_table);
  END LOOP;
END $$;

-- Section 8: Views (v_trash_items covering all 24 tables)
CREATE OR REPLACE VIEW v_trash_items WITH (security_invoker = on) AS
  SELECT id, tenant_id, 'leads'::TEXT AS entity_type, COALESCE(customer_name, destination, id::TEXT)::TEXT AS label, deleted_at, deleted_by FROM leads WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'customers'::TEXT, COALESCE(name, phone, id::TEXT)::TEXT, deleted_at, deleted_by FROM customers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'quotations'::TEXT, COALESCE(quote_number, destination, id::TEXT)::TEXT, deleted_at, deleted_by FROM quotations WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'invoices'::TEXT, COALESCE(invoice_number, customer_name, id::TEXT)::TEXT, deleted_at, deleted_by FROM invoices WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'bookings'::TEXT, COALESCE(booking_ref, customer_name, id::TEXT)::TEXT, deleted_at, deleted_by FROM bookings WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'booking_services'::TEXT, COALESCE(service_title, title, id::TEXT)::TEXT, deleted_at, deleted_by FROM booking_services WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'itineraries'::TEXT, COALESCE(title, destination, id::TEXT)::TEXT, deleted_at, deleted_by FROM itineraries WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'tasks'::TEXT, COALESCE(title, id::TEXT)::TEXT, deleted_at, deleted_by FROM tasks WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'visa_tracking'::TEXT, COALESCE(traveler_name, applicant_name, destination, id::TEXT)::TEXT, deleted_at, deleted_by FROM visa_tracking WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'documents'::TEXT, COALESCE(file_name, traveler_name, id::TEXT)::TEXT, deleted_at, deleted_by FROM documents WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'vouchers'::TEXT, COALESCE(voucher_num, booking_reference, guest_names, id::TEXT)::TEXT, deleted_at, deleted_by FROM vouchers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'cancellations'::TEXT, COALESCE(reason, reason_details, id::TEXT)::TEXT, deleted_at, deleted_by FROM cancellations WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'expenses'::TEXT, COALESCE(description, id::TEXT)::TEXT, deleted_at, deleted_by FROM expenses WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'vendor_ledger'::TEXT, COALESCE(notes, amount::TEXT, id::TEXT)::TEXT, deleted_at, deleted_by FROM vendor_ledger WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'markup_presets'::TEXT, COALESCE(name, id::TEXT)::TEXT, deleted_at, deleted_by FROM markup_presets WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'suppliers'::TEXT, COALESCE(name, email, phone, id::TEXT)::TEXT, deleted_at, deleted_by FROM suppliers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'agents_directory'::TEXT, COALESCE(name, agency_name, id::TEXT)::TEXT, deleted_at, deleted_by FROM agents_directory WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'offers'::TEXT, COALESCE(title, destination, id::TEXT)::TEXT, deleted_at, deleted_by FROM offers WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'support_tickets'::TEXT, COALESCE(subject, id::TEXT)::TEXT, deleted_at, deleted_by FROM support_tickets WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'referrals'::TEXT, COALESCE(status::TEXT, id::TEXT)::TEXT, deleted_at, deleted_by FROM referrals WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'lead_notes'::TEXT, COALESCE(note, content, id::TEXT)::TEXT, deleted_at, deleted_by FROM lead_notes WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'lead_followups'::TEXT, COALESCE(note, due_date::TEXT, id::TEXT)::TEXT, deleted_at, deleted_by FROM lead_followups WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'travel_insurance_policies'::TEXT, COALESCE(policy_number, provider, id::TEXT)::TEXT, deleted_at, deleted_by FROM travel_insurance_policies WHERE deleted_at IS NOT NULL
  UNION ALL
  SELECT id, tenant_id, 'group_booking_members'::TEXT, COALESCE(member_name, id::TEXT)::TEXT, deleted_at, deleted_by FROM group_booking_members WHERE deleted_at IS NOT NULL;

-- Section 9: Soft-delete integrity (deleted_by FK constraints for all applicable tables)
DO $$
DECLARE
  soft_delete_table TEXT;
BEGIN
  FOREACH soft_delete_table IN ARRAY ARRAY[
    'customers',
    'associated_travelers',
    'leads',
    'lead_notes',
    'lead_followups',
    'lead_attachments',
    'lead_documents',
    'lead_communications',
    'post_trip_feedback',
    'referrals',
    'message_templates',
    'quotations',
    'quotation_items',
    'invoices',
    'payment_transactions',
    'expenses',
    'expense_categories',
    'vendor_ledger',
    'markup_presets',
    'bank_accounts',
    'bookings',
    'booking_services',
    'itineraries',
    'itinerary_days',
    'itinerary_items',
    'visa_tracking',
    'visa_documents',
    'travel_insurance_policies',
    'cancellations',
    'tasks',
    'calendar_events',
    'documents',
    'vouchers',
    'group_booking_members',
    'miscellaneous_services',
    'notifications',
    'workspace_messages',
    'master_assets',
    'support_tickets',
    'ticket_replies',
    'suppliers',
    'agents_directory',
    'offers',
    'resource_hub_links',
    'vendor_rate_cards',
    'network_members',
    'network_feed_posts',
    'network_feed_comments',
    'network_feed_reactions',
    'network_messages',
    'network_opportunities',
    'network_post_quality_ratings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS fk_%s_deleted_by_users', soft_delete_table, soft_delete_table);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT fk_%s_deleted_by_users FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL',
      soft_delete_table,
      soft_delete_table
    );
  END LOOP;
END $$;

-- Section 9: Specialized Operations RPCs
CREATE OR REPLACE FUNCTION get_booking_hub_analytics(p_tenant_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'active_bookings', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND status IN ('confirmed', 'partial_payment', 'full_payment') AND deleted_at IS NULL),
    'pending_vouchers', (SELECT count(*) FROM booking_services WHERE tenant_id = p_tenant_id AND voucher_generated = false AND deleted_at IS NULL),
    'upcoming_travel_7d', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND (travel_start_date BETWEEN now() AND now() + interval '7 days') AND deleted_at IS NULL),
    'total_booking_value', (SELECT COALESCE(sum(total_selling_price), 0) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL AND status != 'cancelled')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Section 10: COMMIT;
COMMIT;
