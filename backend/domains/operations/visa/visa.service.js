import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import { resolveBucket } from '../../../providers/storage/storage.js';
import storageService from '../../../providers/storage/storageService.js';

/**
 * VisaService — Specialized Travel Document Compliance
 */
class VisaService {
  /**
   * List visa tracking records with filters
   */
  async listRecords(tenantId, filters) {
    const { lead_id, customer_id, status, page = 1, limit = 50, search } = filters;

    let query = supabaseAdmin
      .from('visa_tracking')
      .select('*, customers(name, phone), leads(destination)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (status) query = query.eq('status', status);
    
    if (search) {
      query = query.or(`applicant_name.ilike.%${search}%,passport_number.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { records: data || [], total: count, page: parseInt(page), limit: parseInt(limit) };
  }

  /**
   * Get detailed visa record
   */
  async getRecord(tenantId, recordId) {
    const { data: visa, error } = await supabaseAdmin
      .from('visa_tracking')
      .select('*, customers(*), leads(*)')
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !visa) throw new Error('Visa record not found');

    // Fetch related documents from the central documents table for this visa
    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('entity_type', 'visa')
      .eq('entity_id', recordId)
      .is('deleted_at', null);

    return { ...visa, documents: documents || [] };
  }

  /**
   * Orchestrate new visa tracking entry
   */
  async createRecord(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('visa_tracking')
      .insert({
        ...payload,
        tenant_id: tenantId,
        status: payload.status || 'document_collection'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update tracking state
   */
  async updateRecord(tenantId, recordId, payload) {
    const updates = { ...payload, updated_at: new Date().toISOString() };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('visa_tracking')
      .update(updates)
      .eq('id', recordId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retire tracking record
   */
  async deleteRecord(tenantId, userId, recordId) {
    return await softDeleteDirect(supabaseAdmin, 'visas', recordId, tenantId);
  }
}

export default new VisaService();
