-- 17-booking-hub-rpc.sql
-- 1. Fix Remaining Financial Inconsistencies (Rename legacy cost columns)
ALTER TABLE quotations RENAME COLUMN total_vendor_cost TO total_cost_price;
ALTER TABLE quotation_items RENAME COLUMN vendor_cost TO cost_price;

-- 2. Create the Booking Hub RPC (The missing 'Phantom RPC')
-- This function orchestrates a single-fetch deep hydration of a booking's context
CREATE OR REPLACE FUNCTION get_booking_hub(p_tenant_id UUID, p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'booking', (SELECT to_jsonb(b) FROM bookings b WHERE b.id = p_booking_id AND b.tenant_id = p_tenant_id),
        'customer', (SELECT to_jsonb(c) FROM customers c WHERE c.id = (SELECT customer_id FROM bookings WHERE id = p_booking_id)),
        'services', (SELECT jsonb_agg(s) FROM booking_services s WHERE s.booking_id = p_booking_id AND s.tenant_id = p_tenant_id AND s.deleted_at IS NULL),
        'payments', (SELECT jsonb_agg(p) FROM payment_transactions p WHERE p.lead_id = (SELECT lead_id FROM bookings WHERE id = p_booking_id) AND p.tenant_id = p_tenant_id AND p.deleted_at IS NULL)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
