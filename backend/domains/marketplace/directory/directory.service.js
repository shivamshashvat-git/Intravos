import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import { resolveBucket } from '../../../providers/storage/storage.js';
import storageService from '../../../providers/storage/storageService.js';

/**
 * DirectoryService — Operational Contact & Vendor Governance
 */
class DirectoryService {
  /**
   * Compute upcoming payment obligations across the vendor network
   */
  async getPaymentCalendar(tenantId, days = 7) {
    const until = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('agents_directory')
      .select('id, name, agency_name, contact_type, outstanding_payables, next_payment_due_at, payment_terms, preferred_channel')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .not('next_payment_due_at', 'is', null)
      .lte('next_payment_due_at', until)
      .order('next_payment_due_at', { ascending: true });

    if (error) throw error;

    const items = (data || []).map((item) => ({
      ...item,
      due_state: item.next_payment_due_at < today ? 'overdue' : item.next_payment_due_at <= until ? 'due_soon' : 'upcoming'
    }));

    return { suppliers: items, total: items.length, until };
  }

  /**
   * List specialized contacts and partners
   */
  async listContacts(tenantId, filters) {
    const { contact_type, search, page = 1, limit = 50 } = filters;
    let query = supabaseAdmin
      .from('agents_directory')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
      .range((page - 1) * limit, page * limit - 1);

    if (contact_type) query = query.eq('contact_type', contact_type);
    if (search) query = query.or(`name.ilike.%${search}%,agency_name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { contacts: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Fetch exhaustive contact profile with secure documentation
   */
  async getContact(tenantId, contactId) {
    const { data: contact, error } = await supabaseAdmin
      .from('agents_directory')
      .select('*')
      .eq('id', contactId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !contact) throw new Error('Contact not found');

    const { data: rateCards, error: cardError } = await supabaseAdmin
      .from('vendor_rate_cards')
      .select('*')
      .eq('vendor_id', contactId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (cardError) throw cardError;

    // Mass signing for performance efficiency
    const paths = (rateCards || []).map(rc => rc.storage_path).filter(Boolean);
    const signedResults = await storageService.getBatchSignedUrls('rateCards', paths);

    const enrichedCards = (rateCards || []).map(rc => ({
      ...rc,
      file_url: signedResults.find(s => s.path === rc.storage_path)?.signedUrl || rc.file_url
    }));

    return {
      ...contact,
      vendor_rate_cards: enrichedCards || []
    };
  }

  /**
   * Register new operational contact
   */
  async createContact(tenantId, payload) {
    const { data, error } = await supabaseAdmin
      .from('agents_directory')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Modify contact attributes
   */
  async updateContact(tenantId, contactId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('agents_directory')
      .update(updates)
      .eq('id', contactId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Attach secure rate card documentation
   */
  async addRateCard(tenantId, userId, contactId, payload) {
    const { title, file_url, storage_path, storage_bucket, season, destination, valid_from, valid_until } = payload;
    if (!title) throw new Error('title is required');

    const { data, error } = await supabaseAdmin
      .from('vendor_rate_cards')
      .insert({
        title,
        file_url: file_url || null,
        storage_bucket: storage_bucket || resolveBucket('rateCards'),
        storage_path: storage_path || null,
        season: season || null,
        destination: destination || null,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        tenant_id: tenantId,
        vendor_id: contactId,
        uploaded_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retire rate card entry
   */
  async deleteRateCard(tenantId, userId, contactId, cardId) {
    return await softDeleteDirect({
      table: 'vendor_rate_cards',
      id: cardId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Vendor rate card',
      extraFilters: { vendor_id: contactId }
    });
  }

  /**
   * Retire directory contact
   */
  async deleteContact(tenantId, userId, contactId) {
    return await softDeleteDirect({
      table: 'agents_directory',
      id: contactId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Directory contact'
    });
  }
}

export default new DirectoryService();
