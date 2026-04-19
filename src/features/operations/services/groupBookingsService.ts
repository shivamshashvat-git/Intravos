import { apiClient } from '@/core/lib/apiClient';

export interface GroupMember {
  id: string;
  booking_id: string;
  member_name: string;
  customer_id?: string;
  pax: number;
  per_person_total: number;
  invoice_id?: string;
  // ... other fields as per backend scaffold
}

export interface GroupBooking {
  id: string;
  group_name: string;
  group_ref: string;
  member_count: number;
  total_pax: number;
  departure_date: string;
  return_date: string;
  itinerary_id?: string;
  status: string;
  itinerary?: { title: string };
  financials?: {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
  };
  members?: any[]; // Detailed members when fetched by ID
}

export const groupBookingsService = {
  getGroups: async (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    // Note: Backend scaffold used /api/operations/bookings/groups but my map showed group-bookings mounting point
    const res = await apiClient(`/api/operations/group-bookings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch groups');
    const data = await res.json();
    return data.groups as GroupBooking[];
  },

  getGroup: async (id: string) => {
    const res = await apiClient(`/api/operations/group-bookings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch group detail');
    const data = await res.json();
    return data.group as GroupBooking;
  },

  createGroup: async (payload: any) => {
    const res = await apiClient('/api/operations/group-bookings/group', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create group booking');
    return res.json();
  },

  addMember: async (groupId: string, payload: any) => {
    const res = await apiClient(`/api/operations/group-bookings/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  removeMember: async (groupId: string, memberId: string) => {
    const res = await apiClient(`/api/operations/group-bookings/${groupId}/members/${memberId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove member');
    return res.json();
  },

  generateInvoices: async (groupId: string) => {
    const res = await apiClient(`/api/operations/group-bookings/${groupId}/generate-invoices`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate group invoice');
    return res.json();
  }
};
