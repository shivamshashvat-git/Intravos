import { supabase } from '@/core/lib/supabase';
import { VisaTracking, VisaFilters, VisaDocument, VisaStatus, PassportCustody, VisaDocumentType } from '../types/visa';

export const visaService = {
  async getVisaList(tenantId: string, filters?: VisaFilters) {
    let query = supabase
      .from('visa_tracking')
      .select('*, customer:customers(name), booking:bookings(id, booking_number, title)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }
      if (filters.passport_custody) query = query.eq('passport_custody', filters.passport_custody);
      if (filters.visa_country) query = query.eq('visa_country', filters.visa_country);
      if (filters.booking_id) query = query.eq('booking_id', filters.booking_id);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      
      if (filters.search) {
        query = query.or(`traveler_name.ilike.%${filters.search}%,passport_number.ilike.%${filters.search}%,visa_country.ilike.%${filters.search}%,vfs_reference_number.ilike.%${filters.search}%`);
      }

      const today = new Date().toISOString().split('T')[0];

      if (filters.expiring_soon) {
        const ninetyDaysLater = new Date();
        ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
        query = query.gte('visa_expiry', today).lte('visa_expiry', ninetyDaysLater.toISOString().split('T')[0]);
      }

      if (filters.appointment_soon) {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        query = query.gte('vfs_appointment_date', today).lte('vfs_appointment_date', sevenDaysLater.toISOString().split('T')[0]);
      }

      if (filters.overdue) {
        query = query.lt('expected_decision_date', today).eq('status', 'under_processing');
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as VisaTracking[];
  },

  async getVisaById(id: string) {
    const { data, error } = await supabase
      .from('visa_tracking')
      .select('*, customer:customers(*), booking:bookings(id, booking_number, title), documents:visa_documents(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as VisaTracking;
  },

  async createVisa(data: Partial<VisaTracking>) {
    const total_amount = (data.visa_fee || 0) + (data.service_charge || 0);
    const { data: created, error } = await supabase
      .from('visa_tracking')
      .insert({ ...data, total_amount })
      .select()
      .single();
    if (error) throw error;
    return created as VisaTracking;
  },

  async updateVisa(id: string, data: Partial<VisaTracking>) {
    const updates: any = { ...data, updated_at: new Date().toISOString() };
    
    // Check if recomputation is needed
    if (data.visa_fee !== undefined || data.service_charge !== undefined) {
      const { data: current } = await supabase.from('visa_tracking').select('visa_fee, service_charge').eq('id', id).single();
      const fee = data.visa_fee !== undefined ? data.visa_fee : (current?.visa_fee || 0);
      const charge = data.service_charge !== undefined ? data.service_charge : (current?.service_charge || 0);
      updates.total_amount = Number(fee) + Number(charge);
    }

    const { data: updated, error } = await supabase
      .from('visa_tracking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as VisaTracking;
  },

  async updateVisaStatus(id: string, status: VisaStatus, extraFields: any = {}) {
    const today = new Date().toISOString().split('T')[0];
    const updates: any = { status, updated_at: new Date().toISOString(), ...extraFields };

    if (status === 'submitted_to_embassy') {
      updates.submitted_at = today;
    } else if (status === 'approved') {
      updates.decision_date = today;
      if (!extraFields.visa_number || !extraFields.visa_expiry) {
        throw new Error('Visa number and expiry date are required for approval status.');
      }
    } else if (status === 'rejected') {
      updates.decision_date = today;
      if (!extraFields.rejection_reason) {
        throw new Error('Rejection reason is required.');
      }
    }

    const { data: updated, error } = await supabase
      .from('visa_tracking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as VisaTracking;
  },

  async updatePassportCustody(id: string, custody: PassportCustody) {
    const updates: any = { passport_custody: custody, updated_at: new Date().toISOString() };
    if (custody === 'returned_to_client') {
      updates.passport_received_date = new Date().toISOString().split('T')[0];
    }
    const { data: updated, error } = await supabase
      .from('visa_tracking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated as VisaTracking;
  },

  async uploadDocument(visaTrackingId: string, tenantId: string, file: File, documentType: VisaDocumentType) {
    const filename = `${Date.now()}_${file.name}`;
    const path = `${tenantId}/${visaTrackingId}/${filename}`;

    const { error: storageError } = await supabase.storage
      .from('visa-documents')
      .upload(path, file);

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage
      .from('visa-documents')
      .getPublicUrl(path);

    const { data: doc, error: dbError } = await supabase
      .from('visa_documents')
      .insert({
        tenant_id: tenantId,
        visa_tracking_id: visaTrackingId,
        document_type: documentType,
        document_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return doc as VisaDocument;
  },

  async deleteDocument(documentId: string, storagePath: string) {
    const { error: storageError } = await supabase.storage
      .from('visa-documents')
      .remove([storagePath]);

    if (storageError) {
      console.warn('Storage delete failed or file missing', storageError);
    }

    const { error: dbError } = await supabase
      .from('visa_documents')
      .delete()
      .eq('id', documentId);
    
    if (dbError) throw dbError;
  },

  async deleteVisa(id: string) {
    const { error } = await supabase
      .from('visa_tracking')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getBookingVisas(bookingId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('visa_tracking')
      .select('*, documents:visa_documents(count)')
      .eq('booking_id', bookingId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (error) throw error;
    return data;
  }
};
