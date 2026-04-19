import { apiClient } from '@/core/lib/apiClient';
import { VisaTracking, VisaFilters, VisaDocument, VisaStatus, PassportCustody, VisaDocumentType } from '../types/visa';

export const visaService = {
  async getVisaList(tenantId: string, filters?: VisaFilters) {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          filters.status.forEach(status => params.append('status[]', status));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.passport_custody) params.append('passport_custody', filters.passport_custody);
      if (filters.visa_country) params.append('visa_country', filters.visa_country);
      if (filters.booking_id) params.append('booking_id', filters.booking_id);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.expiring_soon) params.append('expiring_soon', 'true');
      if (filters.appointment_soon) params.append('appointment_soon', 'true');
      if (filters.overdue) params.append('overdue', 'true');
    }

    const res = await apiClient(`/api/operations/visa?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch visa list');
    const result = await res.json();
    return result.data?.visas || result.data as VisaTracking[];
  },

  async getVisaById(id: string) {
    const res = await apiClient(`/api/operations/visa/${id}`);
    if (!res.ok) throw new Error('Failed to fetch visa details');
    const result = await res.json();
    return result.data?.visa || result.data as VisaTracking;
  },

  async createVisa(data: Partial<VisaTracking>) {
    const res = await apiClient(`/api/operations/visa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create visa');
    const result = await res.json();
    return result.data?.visa as VisaTracking;
  },

  async updateVisa(id: string, data: Partial<VisaTracking>) {
    const res = await apiClient(`/api/operations/visa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update visa');
    const result = await res.json();
    return result.data?.visa as VisaTracking;
  },

  async updateVisaStatus(id: string, status: VisaStatus, extraFields: any = {}) {
    const updates = { status, ...extraFields };
    const res = await apiClient(`/api/operations/visa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update visa status');
    const result = await res.json();
    return result.data?.visa as VisaTracking;
  },

  async updatePassportCustody(id: string, custody: PassportCustody) {
    const res = await apiClient(`/api/operations/visa/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport_custody: custody })
    });
    if (!res.ok) throw new Error('Failed to update passport custody');
    const result = await res.json();
    return result.data?.visa as VisaTracking;
  },

  async uploadDocument(visaTrackingId: string, tenantId: string, file: File, documentType: VisaDocumentType) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);
    
    // We omit Content-Type header to let the browser boundary builder handle it
    const res = await apiClient(`/api/operations/visa/${visaTrackingId}/documents`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload document');
    const result = await res.json();
    return result.data?.document || result.data as VisaDocument;
  },

  async deleteDocument(documentId: string, storagePath: string) {
    const res = await apiClient(`/api/operations/visa/documents/${documentId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
       console.warn('Document API delete failed, it might not be implemented fully on Express yet.');
    }
  },

  async deleteVisa(id: string) {
    const res = await apiClient(`/api/operations/visa/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete visa record');
  },

  async getBookingVisas(bookingId: string, tenantId: string) {
    const res = await apiClient(`/api/operations/visa?booking_id=${bookingId}`);
    if (!res.ok) throw new Error('Failed to fetch booking visas');
    const result = await res.json();
    return result.data?.visas || result.data;
  }
};
