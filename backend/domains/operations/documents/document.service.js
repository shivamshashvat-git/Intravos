import { supabaseAdmin } from '../../../providers/database/supabase.js';
import storageService from '../../../providers/storage/storageService.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import crypto from 'crypto';

/**
 * DocumentService — Secure Asset Management & Distribution
 */
class DocumentService {
  /**
   * Fetch public document via secure token
   */
  async getPublicDocument(token) {
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, file_url, storage_path, storage_bucket, secure_link_expires_at')
      .eq('secure_link', token)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!document) throw new Error('Secure document link not found');
    
    if (document.secure_link_expires_at && new Date(document.secure_link_expires_at) < new Date()) {
      throw new Error('Secure document link has expired');
    }

    const signedUrl = await storageService.getSignedUrl(document.storage_bucket, document.storage_path);
    return { ...document, file_url: signedUrl };
  }

  /**
   * Prefetch documents for upcoming travel (PWA offline support)
   */
  async getTravelPack(tenantId, windowDays = 7) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + windowDays);

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('travel_start_date', new Date().toISOString())
      .lte('travel_start_date', threshold.toISOString())
      .is('deleted_at', null);

    const bookingIds = (bookings || []).map(b => b.id);
    if (bookingIds.length === 0) return { documents: [], message: 'No upcoming trips' };

    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, storage_path, storage_bucket, file_size_bytes, mime_type, booking_id')
      .eq('tenant_id', tenantId)
      .in('booking_id', bookingIds)
      .eq('included_in_travel_pack', true)
      .is('deleted_at', null);

    const paths = (documents || []).map(d => d.storage_path);
    const signedMap = await storageService.getBatchSignedUrls('documents', paths);
    
    const enriched = (documents || []).map(d => ({
      ...d,
      file_url: signedMap.find(s => s.path === d.storage_path)?.signedUrl || null
    }));

    return {
      prefetch_window_days: windowDays,
      documents: enriched,
      total_payload_bytes: (documents || []).reduce((sum, d) => sum + Number(d.file_size_bytes || 0), 0)
    };
  }

  /**
   * List documents with multi-dimensional filters & mass signing
   */
  async listDocuments(tenantId, filters) {
    const { customer_id, booking_id, lead_id, category, page = 1, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (customer_id) query = query.eq('customer_id', customer_id);
    if (booking_id) query = query.eq('booking_id', booking_id);
    if (lead_id) query = query.eq('lead_id', lead_id);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;

    const paths = (data || []).map(d => d.storage_path).filter(Boolean);
    const signedResults = await storageService.getBatchSignedUrls('documents', paths);

    const enriched = (data || []).map(doc => ({
      ...doc,
      file_url: signedResults.find(s => s.path === doc.storage_path)?.signedUrl || doc.file_url 
    }));

    return { documents: enriched, total: count || 0, page: parseInt(page, 10) };
  }

  /**
   * Generate secure public link for a document
   */
  async generateSecureLink(tenantId, documentId) {
    const { data: document } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!document) throw new Error('Document not found');

    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    if (document.booking_id) {
      const { data: booking } = await supabaseAdmin.from('bookings').select('travel_end_date').eq('id', document.booking_id).maybeSingle();
      if (booking?.travel_end_date) {
        expiresAt = new Date(`${booking.travel_end_date}T23:59:59.000Z`);
      }
    }

    const token = crypto.randomBytes(24).toString('hex');
    const { data } = await supabaseAdmin
      .from('documents')
      .update({
        secure_link: token,
        secure_link_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', document.id)
      .select()
      .single();

    return {
      document: data,
      secure_url: `/api/v1/documents/public/${token}`
    };
  }

  /**
   * Orchestrate secure file upload with quota enforcement
   */
  async uploadDocument(tenantId, userId, file, metadata = {}) {
    const ext = this._extensionOf(file.originalname);
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      throw new Error('Only PDF, JPG, JPEG, and PNG are allowed');
    }

    // Quota Enforcement
    const quotaBytes = await this._storageQuotaForTenant(tenantId);
    const { data: totals } = await supabaseAdmin.from('documents').select('file_size_bytes').eq('tenant_id', tenantId).is('deleted_at', null);
    const usedBytes = (totals || []).reduce((sum, item) => sum + (Number(item.file_size_bytes) || 0), 0);
    
    if (usedBytes + file.size > quotaBytes) {
      throw new Error('Storage quota reached');
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${tenantId}/${Date.now()}-${safeName}`;

    await storageService.upload('documents', path, file.buffer, { contentType: file.mimetype });
    const signedUrl = await storageService.getSignedUrl('documents', path);

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        tenant_id: tenantId,
        customer_id: metadata.customer_id || null,
        booking_id: metadata.booking_id || null,
        lead_id: metadata.lead_id || null,
        traveler_name: metadata.traveler_name || null,
        category: metadata.category || 'other',
        file_name: file.originalname,
        file_url: path,
        storage_bucket: 'documents',
        storage_path: path,
        file_size_bytes: file.size,
        mime_type: file.mimetype,
        included_in_travel_pack: metadata.included_in_travel_pack === 'true' || metadata.included_in_travel_pack === true,
        uploaded_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, file_url: signedUrl };
  }

  /**
   * Internal Quota Resolver
   */
  async _storageQuotaForTenant(tenantId) {
    const { data } = await supabaseAdmin.from('tenants').select('plan').eq('id', tenantId).single();
    if (data?.plan === 'pro') return 5 * 1024 * 1024 * 1024;
    if (data?.plan === 'growth') return 1 * 1024 * 1024 * 1024;
    return 100 * 1024 * 1024;
  }

  _extensionOf(filename) { return filename.split('.').pop()?.toLowerCase() || ''; }

  /**
   * Purge document from DB and Cloud Storage
   */
  async deleteDocument(tenantId, userId, documentId) {
    const { data: doc } = await supabaseAdmin.from('documents').select('id, storage_bucket, storage_path').eq('id', documentId).eq('tenant_id', tenantId).single();
    if (!doc) throw new Error('Document not found');

    if (doc.storage_bucket && doc.storage_path) {
      await storageService.delete(doc.storage_bucket, doc.storage_path);
    }

    return await softDeleteDirect({
      table: 'documents',
      id: documentId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Document',
      select: 'id, file_name, deleted_at'
    });
  }
}

export default new DocumentService();
