import { supabaseAdmin } from '../../../providers/database/supabase.js';
import seedService from '../system/seedService.js';

/**
 * TenantService — Master Tenant Lifecycle Orchestrator
 */
class TenantService {
  /**
   * Create a new Tenant and bootstrap it with necessary seed data
   */
  async createTenant({ name, slug, plan = 'pro', contact_email }) {
    if (!name || !slug) throw new Error('Tenant name and slug are required');

    // 1. Create the tenant entry
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug: slug.toLowerCase(),
        plan,
        contact_email,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error(`Slug '${slug}' is already taken.`);
      throw error;
    }

    // 2. Provision default assets (Settings, etc.) via SeedService if applicable
    // Note: SeedService usually handles demo data, but we use it for platform defaults too.
    try {
      // Create default settings row
      await supabaseAdmin.from('tenant_settings').insert({
        tenant_id: tenant.id,
        org_name: name,
        support_email: contact_email
      });
    } catch (e) {
      console.error("Non-critical failure in tenant setting creation:", e.message);
    }

    return tenant;
  }

  /**
   * Create from a Sales Request (The 'Approve' action)
   */
  async createFromRequest(salesRequest) {
    const slug = salesRequest.organization 
      ? salesRequest.organization.toLowerCase().replace(/\s+/g, '-') 
      : salesRequest.name.toLowerCase().replace(/\s+/g, '-') + '-agency';

    const tenant = await this.createTenant({
      name: salesRequest.organization || salesRequest.name,
      slug,
      plan: 'pro', // Default plan for new signups
      contact_email: salesRequest.email
    });

    return tenant;
  }

  async getById(id) {
    const { data, error } = await supabaseAdmin.from('tenants').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
}

export default new TenantService();
