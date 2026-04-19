
import { apiClient } from '@/core/lib/apiClient';
import { Booking, BookingService, GroupMember, BookingStatus, BookingFilters } from '../types/booking';

export const bookingsService = {
  async getBookings(tenantId: string, filters?: BookingFilters) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id);
    if (filters?.search) params.append('search', filters.search);

    const res = await apiClient(`/api/operations/bookings?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const result = await res.json();
    return result.data?.bookings || result.data as Booking[];
  },

  async getBookingHub(id: string) {
    const res = await apiClient(`/api/operations/bookings/${id}/hub`);
    if (!res.ok) throw new Error('Failed to fetch booking hub');
    const result = await res.json();
    return result.data?.hub;
  },

  async getBookingHubAnalytics() {
    const res = await apiClient(`/api/operations/bookings/hub-analytics`);
    if (!res.ok) throw new Error('Failed to fetch hub analytics');
    const result = await res.json();
    return result.data?.analytics;
  },

  async createBooking(payload: any) {
    const res = await apiClient(`/api/operations/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create booking');
    const result = await res.json();
    return result.data?.booking as Booking;
  },

  async updateBooking(id: string, updates: Partial<Booking>) {
    const res = await apiClient(`/api/operations/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update booking');
    return (await res.json()).data?.booking;
  },

  async deleteBooking(id: string) {
    const res = await apiClient(`/api/operations/bookings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete booking');
  },

  // Services Management
  async getBookingServices(bookingId: string) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return (await res.json()).data?.services;
  },

  async addService(bookingId: string, service: any) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (!res.ok) throw new Error('Failed to add service');
    return (await res.json()).data?.service;
  },

  async updateService(bookingId: string, serviceId: string, updates: any) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update service');
    return (await res.json()).data?.service;
  },

  async deleteService(bookingId: string, serviceId: string) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/services/${serviceId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete service');
  },

  // Group Members
  async getGroupMembers(bookingId: string) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/group-members`);
    if (!res.ok) throw new Error('Failed to fetch group members');
    return (await res.json()).data?.members;
  },

  async addGroupMember(bookingId: string, member: any) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/group-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (!res.ok) throw new Error('Failed to add group member');
    return (await res.json()).data?.member;
  },

  async updateGroupMember(memberId: string, updates: any) {
    const res = await apiClient(`/api/operations/group-members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update member');
    return (await res.json()).data?.member;
  },

  async deleteGroupMember(memberId: string) {
    const res = await apiClient(`/api/operations/group-members/${memberId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete member');
  },

  // Cancellation
  async cancelBooking(bookingId: string, payload: any) {
    const res = await apiClient(`/api/operations/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return (await res.json()).data?.cancellation;
  }
};
