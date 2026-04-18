-- 09-payment-transactions.sql
-- Create payment_transactions table for Indian travel agency finance workflow

-- Create payment_method enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM (
            'upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    booking_id UUID, -- placeholder for when bookings module is built
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    payment_method payment_method NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT, -- UTR, cheque number, UPI ref, etc.
    notes TEXT,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Super admin: full access (already covered by global sa_all policy)
-- Tenant access: tenant_id::text = auth_tenant_id()
CREATE POLICY tenant_all_payments ON payment_transactions
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
