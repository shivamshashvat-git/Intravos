-- 12-visa-system.sql
-- Sub-system for tracking traveler visa applications and document custody

-- Enums are assumed to be handled or created in migration 00 or 10
-- We will use TEXT for flexibility if status enums aren't strictly defined yet, but prompt specifies visa_status.

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

-- Visa Tracking Table
CREATE TABLE IF NOT EXISTS visa_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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
    assigned_to UUID REFERENCES users(id),
    status visa_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Visa Documents (Checklist)
CREATE TABLE IF NOT EXISTS visa_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visa_tracking_id UUID NOT NULL REFERENCES visa_tracking(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL,
    file_url TEXT,
    storage_bucket TEXT,
    storage_path TEXT,
    status doc_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(visa_tracking_id, doc_type)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_visa_tracking_tenant ON visa_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visa_tracking_lead ON visa_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_visa_docs_tracking ON visa_documents(visa_tracking_id);

-- RLS
ALTER TABLE visa_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_all_visa_tracking ON visa_tracking
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY tenant_all_visa_documents ON visa_documents
    AS PERMISSIVE FOR ALL TO authenticated
    USING ((SELECT tenant_id FROM visa_tracking WHERE id = visa_tracking_id)::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK ((SELECT tenant_id FROM visa_tracking WHERE id = visa_tracking_id)::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
