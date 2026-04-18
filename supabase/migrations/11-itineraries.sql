-- 11-itineraries.sql
-- Itinerary planning system for travel packages

-- Create itinerary_item_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itinerary_item_type') THEN
        CREATE TYPE itinerary_item_type AS ENUM (
            'hotel', 'flight', 'activity', 'transfer', 'note', 'meal',
            'internal_note', 'insurance', 'lounge', 'sim_card', 'forex'
        );
    END IF;
END $$;

-- Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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

-- Itinerary Days
CREATE TABLE IF NOT EXISTS itinerary_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Itinerary Items
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    item_type itinerary_item_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_val TEXT,
    sort_order INTEGER DEFAULT 0,
    media_urls JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_itineraries_tenant ON itineraries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_lead ON itineraries(lead_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON itinerary_items(day_id);

-- RLS
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- Tenant access policies
CREATE POLICY tenant_all_itineraries ON itineraries
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY tenant_all_itinerary_days ON itinerary_days
    AS PERMISSIVE FOR ALL TO authenticated
    USING ((SELECT tenant_id FROM itineraries WHERE id = itinerary_id)::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK ((SELECT tenant_id FROM itineraries WHERE id = itinerary_id)::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY tenant_all_itinerary_items ON itinerary_items
    AS PERMISSIVE FOR ALL TO authenticated
    USING ((SELECT tenant_id FROM itineraries WHERE id = (SELECT itinerary_id FROM itinerary_days WHERE id = day_id))::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK ((SELECT tenant_id FROM itineraries WHERE id = (SELECT itinerary_id FROM itinerary_days WHERE id = day_id))::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Public share policy (No Auth Required for SELECT)
CREATE POLICY itinerary_public_share ON itineraries 
    FOR SELECT TO anon, authenticated
    USING (is_shared = true AND deleted_at IS NULL);

CREATE POLICY itinerary_days_public_share ON itinerary_days
    FOR SELECT TO anon, authenticated
    USING ((SELECT is_shared FROM itineraries WHERE id = itinerary_id) = true AND deleted_at IS NULL);

CREATE POLICY itinerary_items_public_share ON itinerary_items
    FOR SELECT TO anon, authenticated
    USING ((SELECT is_shared FROM itineraries WHERE id = (SELECT itinerary_id FROM itinerary_days WHERE id = day_id)) = true AND deleted_at IS NULL);
