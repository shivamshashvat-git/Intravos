import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * MasterAssetService — The "Knowledge Bank" Orchestrator
 * Centralizes agency templates and deep-cloning logic for repeatable workflows.
 */
class MasterAssetService {
  /**
   * List specialized assets with global visibility support
   */
  async listAssets(tenantId, filters) {
    const { asset_type, tag, search, page = 1, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('master_assets')
      .select('*', { count: 'exact' })
      .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (asset_type) query = query.eq('asset_type', asset_type);
    if (tag) query = query.contains('tags', [tag]);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      assets: data || [],
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  /**
   * Fetch single asset with ownership validation
   */
  async getAsset(tenantId, assetId) {
    const { data, error } = await supabaseAdmin
      .from('master_assets')
      .select('*')
      .eq('id', assetId)
      .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Manual Template Creation
   */
  async createAsset(tenantId, userId, payload) {
    const { data, error } = await supabaseAdmin
      .from('master_assets')
      .insert({
        ...payload,
        tenant_id: tenantId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * [Library Import] Enshrine an existing entity as a reusable template
   */
  async importToLibrary(tenantId, userId, payload) {
    const { entity_type, entity_id, title, tags } = payload;

    if (entity_type !== 'itinerary') {
       throw new Error('Currently only itineraries can be enshrined in the Knowledge Bank');
    }

    // 1. Fetch the deep structure
    const { data: itinerary, error: fetchErr } = await supabaseAdmin
      .from('itineraries')
      .select('*, itinerary_days(*, itinerary_items(*))')
      .eq('id', entity_id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchErr || !itinerary) throw new Error('Source itinerary not found');

    // 2. Persist as Master Asset
    const { data: asset, error: insertErr } = await supabaseAdmin
      .from('master_assets')
      .insert({
        tenant_id: tenantId,
        asset_type: 'itinerary',
        title: title || `Template: ${itinerary.title}`,
        description: itinerary.destination || 'Saved itinerary template',
        content: itinerary, // Full nested structure stored as JSONB
        tags: tags || [],
        created_by: userId
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return asset;
  }

  /**
   * [Library Pull] Deep-clone a template into a live operation
   */
  async instantiateAsset(tenantId, userId, assetId, options) {
    const { lead_id, booking_id } = options;
    if (!lead_id && !booking_id) throw new Error('lead_id or booking_id is required for instantiation');

    const asset = await this.getAsset(tenantId, assetId);
    if (!asset) throw new Error('Asset not found');

    // BRANCH: Itinerary Deep Clone
    if (asset.asset_type === 'itinerary') {
      return await this._instantiateItinerary(tenantId, userId, asset, { lead_id, booking_id });
    }
    
    // BRANCH: Document Template
    if (asset.asset_type === 'document' || asset.asset_type === 'template') {
      return await this._instantiateDocument(tenantId, userId, asset, { lead_id, booking_id });
    }

    // BRANCH: Checklist / Task Set
    if (asset.asset_type === 'checklist') {
      return await this._instantiateChecklist(tenantId, userId, asset, { lead_id, booking_id });
    }

    throw new Error(`Instantiation not implemented for type: ${asset.asset_type}`);
  }

  /**
   * Basic Attribute Update
   */
  async updateAsset(tenantId, assetId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('master_assets')
      .update(updates)
      .eq('id', assetId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retirement
   */
  async deleteAsset(tenantId, userId, assetId) {
    return await softDeleteDirect({
      table: 'master_assets',
      id: assetId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Master Asset',
      select: 'id, title, deleted_at'
    });
  }

  // --- ATOMIC DEEP CLONING HELPERS ---

  async _instantiateItinerary(tenantId, userId, asset, { lead_id, booking_id }) {
    const itenData = asset.content;
    
    // 1. Create Base Itinerary
    const { data: newIten, error: itenErr } = await supabaseAdmin
      .from('itineraries')
      .insert({
        tenant_id: tenantId,
        lead_id: lead_id || null,
        booking_id: booking_id || null,
        title: itenData.title,
        destination: itenData.destination,
        start_date: itenData.start_date,
        end_date: itenData.end_date,
        template_name: asset.title,
        created_by: userId
      })
      .select()
      .single();

    if (itenErr) throw itenErr;

    // 2. Clone Days & Recursive Items
    if (itenData.itinerary_days && Array.isArray(itenData.itinerary_days)) {
      for (const day of itenData.itinerary_days) {
        const { data: newDay } = await supabaseAdmin
          .from('itinerary_days')
          .insert({
            itinerary_id: newIten.id,
            day_number: day.day_number,
            title: day.title,
            description: day.description
          })
          .select()
          .single();

        if (day.itinerary_items && Array.isArray(day.itinerary_items)) {
           const items = day.itinerary_items.map(item => ({
             day_id: newDay.id,
             item_type: item.item_type,
             title: item.title,
             description: item.description,
             time: item.time
           }));
           await supabaseAdmin.from('itinerary_items').insert(items);
        }
      }
    }

    return { itinerary: newIten };
  }

  async _instantiateDocument(tenantId, userId, asset, { lead_id, booking_id }) {
    const docData = asset.content;
    const { data: newDoc, error: docErr } = await supabaseAdmin
      .from('documents')
      .insert({
        tenant_id: tenantId,
        lead_id: lead_id || null,
        booking_id: booking_id || null,
        file_name: docData?.file_name || asset.title,
        category: 'template',
        file_url: docData?.file_url || null,
        uploaded_by: userId
      })
      .select()
      .single();
    
    if (docErr) throw docErr;
    return { document: newDoc };
  }

  async _instantiateChecklist(tenantId, userId, asset, { lead_id, booking_id }) {
    const taskData = asset.content;
    const items = Array.isArray(taskData) ? taskData : [taskData];
    
    const tasksToInsert = items.map(item => ({
      tenant_id: tenantId,
      lead_id: lead_id || null,
      booking_id: booking_id || null,
      title: item.title || asset.title,
      description: typeof item === 'object' ? item.description : String(item),
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: item.priority || 'medium',
      assigned_to: userId
    }));

    const { data: newTasks, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (taskErr) throw taskErr;
    return { tasks: newTasks };
  }
}

export default new MasterAssetService();
