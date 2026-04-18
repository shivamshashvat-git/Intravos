-- 14-bank-accounts.sql
-- Sub-system for tracking agency bank nodes and operational balances

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
        CREATE TYPE account_type AS ENUM ('current', 'savings', 'upi');
    END IF;
END $$;

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    acc_type account_type NOT NULL DEFAULT 'current',
    running_balance DECIMAL(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON bank_accounts(tenant_id);

-- RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_all_bank_accounts ON bank_accounts
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Ensure tenants table has necessary columns if missing (from Phase 01/02)
-- We check and add columns to tenants for agency specifics
DO $$
BEGIN
    -- Profile
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_address') THEN
        ALTER TABLE tenants ADD COLUMN agency_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_phone') THEN
        ALTER TABLE tenants ADD COLUMN agency_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_email') THEN
        ALTER TABLE tenants ADD COLUMN agency_email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='gstin') THEN
        ALTER TABLE tenants ADD COLUMN gstin TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='pan') THEN
        ALTER TABLE tenants ADD COLUMN pan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='agency_website') THEN
        ALTER TABLE tenants ADD COLUMN agency_website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='primary_color') THEN
        ALTER TABLE tenants ADD COLUMN primary_color TEXT;
    END IF;
    
    -- Invoicing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_prefix') THEN
        ALTER TABLE tenants ADD COLUMN invoice_prefix TEXT DEFAULT 'INV';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_next_num') THEN
        ALTER TABLE tenants ADD COLUMN invoice_next_num INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='invoice_bank_text') THEN
        ALTER TABLE tenants ADD COLUMN invoice_bank_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_prefix') THEN
        ALTER TABLE tenants ADD COLUMN quote_prefix TEXT DEFAULT 'Q';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_validity') THEN
        ALTER TABLE tenants ADD COLUMN quote_validity INTEGER DEFAULT 7;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='quote_terms') THEN
        ALTER TABLE tenants ADD COLUMN quote_terms TEXT;
    END IF;
END $$;
