-- ============================================================
-- INTRAVOS MASTER SCHEMA
-- Phase: 00 - Base Extensions and Enums
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES (ENUMS)
DO $$ 
BEGIN 
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'partner'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'quoted', 'booked', 'completed', 'cancelled'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE lead_priority AS ENUM ('low', 'normal', 'high', 'urgent'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE comm_type AS ENUM ('call', 'whatsapp', 'email', 'sms', 'in_person'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE payment_method AS ENUM ('upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE itinerary_item_type AS ENUM ('hotel', 'flight', 'activity', 'transfer', 'note', 'meal', 'internal_note', 'insurance', 'lounge', 'sim_card', 'forex'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE visa_status AS ENUM ('not_started', 'docs_collecting', 'docs_collected', 'applied', 'in_process', 'approved', 'rejected'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE passport_holder AS ENUM ('customer', 'agency', 'vfs', 'embassy', 'returned'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE doc_status AS ENUM ('pending', 'uploaded', 'verified', 'not_needed'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE notification_type AS ENUM ('lead_assigned', 'lead_status_changed', 'note_added', 'followup_due', 'followup_overdue', 'engagement_birthday', 'engagement_anniversary', 'engagement_dormant', 'engagement_post_trip', 'task_assigned', 'task_due', 'payment_pending', 'payment_received', 'payment_overdue', 'trial_expiring', 'trial_expired', 'announcement', 'system'); 
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
  CREATE TYPE ticket_type AS ENUM ('support', 'bug', 'feature_request'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  CREATE TYPE changelog_action AS ENUM ('tenant_created', 'tenant_activated', 'tenant_paused', 'tenant_plan_changed', 'trial_started', 'trial_extended', 'trial_expired', 'trial_converted', 'payment_received_platform', 'feature_toggled', 'feature_locked', 'feature_unlocked', 'user_created', 'user_deactivated', 'settings_changed', 'ticket_created', 'ticket_resolved', 'announcement_created', 'maintenance_scheduled', 'subscription_activated', 'subscription_renewed', 'subscription_grace', 'subscription_limited', 'subscription_suspended', 'free_access_granted', 'free_access_expired', 'upgrade_requested', 'upgrade_approved', 'upgrade_rejected', 'pricing_changed', 'customer_merged', 'impersonation_started', 'impersonation_ended'); 
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
