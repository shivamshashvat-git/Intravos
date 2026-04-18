-- 10-bookings-and-visas.sql
-- Create bookings table and group management for Indian travel agencies

-- Create booking_status types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM (
            'confirmed', 'in_progress', 'completed', 'cancelled'
        );
    END IF;
END $$;

-- Create refund_status types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status') THEN
        CREATE TYPE refund_status AS ENUM (
            'not_applicable', 'pending', 'partial', 'full', 'none'
        );
    END IF;
END $$;

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
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

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_booking_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    room_sharing TEXT,
    add_ons JSONB DEFAULT '[]',
    base_cost DECIMAL(12,2) DEFAULT 0,
    room_upgrade DECIMAL(12,2) DEFAULT 0,
    add_on_total DECIMAL(12,2) DEFAULT 0,
    per_person_total DECIMAL(12,2) DEFAULT 0,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_group_members_booking ON group_booking_members(booking_id);

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_booking_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_all_bookings ON bookings
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY tenant_all_group_members ON group_booking_members
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
