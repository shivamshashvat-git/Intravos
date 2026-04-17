import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * OfferService — Marketing Asset & Public Discovery Orchestrator
 */
class OfferService {
  /**
   * Resolve public landing page offers via agency slug
   */
  async getPublicOffersBySlug(slug) {
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (tenantError || !tenant) throw new Error('Agency not found');

    const { data: offers, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order');

    if (error) throw error;

    return {
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      offers: offers || []
    };
  }

  /**
   * List internal offers for a tenant
   */
  async listOffers(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Register a new marketing offer
   */
  async createOffer(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('offers')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Synchronize offer display order
   */
  async reorderOffers(tenantId, orderedIds) {
    if (!Array.isArray(orderedIds)) throw new Error('ordered_ids array required');

    // Use a transaction/RPC or sequence of updates
    // For now, keeping the loop but ensuring it's in the service
    let sort = 0;
    for (const id of orderedIds) {
      await supabaseAdmin
        .from('offers')
        .update({ sort_order: sort++ })
        .eq('id', id)
        .eq('tenant_id', tenantId);
    }
    return true;
  }

  /**
   * Modify offer attributes
   */
  async updateOffer(tenantId, offerId, updates) {
    const patch = { ...updates };
    delete patch.id;
    delete patch.tenant_id;
    delete patch.deleted_at;
    delete patch.deleted_by;

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update(patch)
      .eq('id', offerId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft-delete an offer
   */
  async deleteOffer(tenantId, userId, offerId) {
    return await softDeleteDirect({
      table: 'offers',
      id: offerId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Offer'
    });
  }
}

export default new OfferService();
