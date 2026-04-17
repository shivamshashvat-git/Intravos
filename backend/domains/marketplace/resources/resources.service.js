import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * ResourceService — Resource Hub & External Utility Orchestrator
 */
class ResourceService {
  /**
   * Aggregate resource hub link categories
   */
  async listCategories(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('resource_hub_links')
      .select('category, is_system, tenant_id')
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);

    if (error) throw error;

    const categoryMap = {};
    for (const item of data || []) {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { category: item.category, total: 0, system_links: 0, custom_links: 0 };
      }
      categoryMap[item.category].total += 1;
      if (item.is_system) categoryMap[item.category].system_links += 1;
      else categoryMap[item.category].custom_links += 1;
    }

    return Object.values(categoryMap).sort((a, b) => a.category.localeCompare(b.category));
  }

  /**
   * List available resource hub links with categorization and search filtering
   */
  async listResources(tenantId, filters = {}) {
    const { category, q = '' } = filters;
    const search = q.trim().toLowerCase();

    let query = supabaseAdmin
      .from('resource_hub_links')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .order('is_system', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;

    if (!search) return data || [];

    return (data || []).filter((item) => {
      const haystack = [item.title, item.provider, item.url].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }

  /**
   * Register a custom resource link (Agency-specific)
   */
  async createResource(tenantId, userId, payload) {
    const { category, title, url, provider, preview_mode, is_active, sort_order, metadata } = payload;
    if (!category || !title || !url) throw new Error('category, title, and url are required');

    const resourcePayload = {
      tenant_id: tenantId,
      created_by: userId,
      category,
      title,
      url,
      provider: provider || null,
      preview_mode: preview_mode || 'iframe',
      is_system: false,
      is_active: is_active !== undefined ? !!is_active : true,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      metadata: metadata && typeof metadata === 'object' ? metadata : {}
    };

    const { data, error } = await supabaseAdmin
      .from('resource_hub_links')
      .insert(resourcePayload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Modify a custom resource link
   */
  async updateResource(tenantId, resourceId, updates) {
    const { data: current } = await supabaseAdmin.from('resource_hub_links').select('*').eq('id', resourceId).eq('tenant_id', tenantId).maybeSingle();
    if (!current) throw new Error('Custom resource not found');

    const patch = { ...updates, updated_at: new Date().toISOString() };
    delete patch.id;
    delete patch.tenant_id;
    delete patch.is_system;

    const { data, error } = await supabaseAdmin
      .from('resource_hub_links')
      .update(patch)
      .eq('id', resourceId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Track resource usage and resolve open mode
   */
  async trackUsage(tenantId, resourceId) {
    const { data: resource, error } = await supabaseAdmin
      .from('resource_hub_links')
      .select('*')
      .eq('id', resourceId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      .maybeSingle();

    if (error || !resource) throw new Error('Resource not found');

    await supabaseAdmin
      .from('resource_hub_links')
      .update({ usage_count: (resource.usage_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', resourceId);

    return { resource, open_mode: resource.preview_mode === 'iframe' ? 'iframe' : 'new_tab' };
  }

  /**
   * Soft-delete a custom resource link
   */
  async deleteResource(tenantId, userId, resourceId) {
    return await softDeleteDirect({
      table: 'resource_hub_links',
      id: resourceId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Resource Hub link',
      extraFilters: { is_system: false }
    });
  }
}

export default new ResourceService();
