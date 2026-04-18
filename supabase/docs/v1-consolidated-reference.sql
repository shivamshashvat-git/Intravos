-- V1 CONSOLIDATED SCHEMA REFERENCE
-- This is NOT meant to be re-run. It is the human-readable record of the final V1 schema after all migrations.
-- Generated: 2026-04-18
-- Includes all migrations from 00 to 16.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BASE TYPES & ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff', 'partner');
CREATE TYPE lead_source AS ENUM ('whatsapp', 'manual', 'website', 'referral', 'agent', 'network', 'campaign', 'instagram');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'quote_sent', 'negotiating', 'converted', 'lost', 'on_hold');
CREATE TYPE lead_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'revised');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE visa_status AS ENUM ('not_started', 'docs_collecting', 'docs_collected', 'applied', 'in_process', 'approved', 'rejected');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE DOMAIN: AUTH & TENANCY
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    gstin TEXT, -- Consolidated in migration 08
    pan TEXT,
    agency_address TEXT,
    agency_phone TEXT,
    agency_email TEXT,
    agency_website TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_next_num INTEGER DEFAULT 1,
    invoice_bank_text TEXT,
    quote_prefix TEXT DEFAULT 'Q',
    quote_next_num INTEGER DEFAULT 1,
    quote_validity INTEGER DEFAULT 7,
    quote_terms TEXT,
    quote_inclusions TEXT,
    quote_exclusions TEXT,
    plan TEXT NOT NULL DEFAULT 'starter',
    subscription_status TEXT NOT NULL DEFAULT 'trial',
    trial_end DATE,
    max_seats INTEGER DEFAULT 2,
    features_enabled JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    avatar_url TEXT,
    designation TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CRM DOMAIN: LEADS & CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    passport_number TEXT,
    passport_expiry DATE,
    pan_number TEXT,
    gst_number TEXT,
    aadhar_number TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    destination TEXT,
    status lead_status NOT NULL DEFAULT 'new',
    priority lead_priority NOT NULL DEFAULT 'normal',
    pax_adults INTEGER DEFAULT 1,
    pax_children INTEGER DEFAULT 0, -- Added in migration 16
    pax_infants INTEGER DEFAULT 0,   -- Added in migration 16
    selling_price DECIMAL(12,2) DEFAULT 0, -- Renamed in migration 16
    cost_price DECIMAL(12,2) DEFAULT 0,    -- Renamed in migration 16
    amount_collected DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE, -- Added in migration 16
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE lead_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comm_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    summary TEXT,
    comm_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FINANCE DOMAIN: QUOTATIONS & INVOICES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL,
    total DECIMAL(12,2) DEFAULT 0,
    status quotation_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    total DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. OPERATIONS DOMAIN: BOOKINGS & VISAS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_ref TEXT NOT NULL,
    status booking_status DEFAULT 'confirmed',
    pax_adults INTEGER DEFAULT 1,
    pax_children INTEGER DEFAULT 0,
    pax_infants INTEGER DEFAULT 0,
    total_selling_price DECIMAL(12,2) DEFAULT 0,
    total_cost_price DECIMAL(12,2) DEFAULT 0,
    amount_collected DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE visa_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    traveler_name TEXT NOT NULL,
    passport_holder TEXT DEFAULT 'customer',
    status visa_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SYSTEM UTILITIES: TASKS & DASHBOARD
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dashboard_stats_cache (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    active_leads_count INTEGER DEFAULT 0,
    revenue_this_month DECIMAL(14,2) DEFAULT 0,
    collected_this_month DECIMAL(14,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Tenant Policy (Simplified for reference)
-- ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_access ON tablename FOR ALL USING (tenant_id::text = auth_tenant_id());
