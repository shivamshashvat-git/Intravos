import { supabaseAdmin } from '../../../providers/database/supabase.js';
import tenantService from '../tenants/tenants.service.js';

/**
 * SalesService — Platform Growth & Prospect Management Orchestrator
 */
class SalesService {
  /**
   * Register a new platform inquiry and orchestrate internal notification logic
   */
  async submitInquiry(payload) {
    const { name, email, phone, organization, source, features_interested, message, metadata } = payload;
    if (!name || !email || !phone) throw new Error('Name, email, and phone are required');

    const { data, error } = await supabaseAdmin
      .from('sales_inquiries')
      .insert({
        name,
        email,
        phone,
        organization: organization || null,
        source: source || 'organic',
        features_interested: features_interested || [],
        message: message || '',
        status: 'new', // Explicitly set starting status
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * List all platform prospects (Super Admin ONLY)
   */
  async listInquiries(actorRole) {
    if (actorRole !== 'super_admin') throw new Error('Super Admin access required for prospect data');

    const { data, error } = await supabaseAdmin
      .from('sales_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Transition prospect status in the sales funnel
   */
  async updateInquiryStatus(actorRole, inquiryId, status) {
    if (actorRole !== 'super_admin') throw new Error('Super Admin access required for prospect management');

    // 1. Update the request
    const { data: request, error } = await supabaseAdmin
      .from('sales_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .select()
      .single();

    if (error) throw error;
    if (!request) throw new Error('Inquiry not found');

    // 2. If status is 'approved', provision the tenant
    if (status === 'approved') {
      try {
        const tenant = await tenantService.createFromRequest(request);
        
        // Update request with the new tenant_id and mark as 'provisioned'
        await supabaseAdmin
          .from('sales_inquiries')
          .update({ 
            status: 'provisioned', 
            metadata: { ...request.metadata, provisioned_tenant_id: tenant.id } 
          })
          .eq('id', inquiryId);
          
        return { ...request, status: 'provisioned', tenant_id: tenant.id };
      } catch (provisionError) {
        console.error("Provisioning failed:", provisionError.message);
        // We keep it as 'approved' but log the error
        return { ...request, error: "Approved but provisioning failed: " + provisionError.message };
      }
    }

    return request;
  }
}

export default new SalesService();
