import { supabase } from '@/core/lib/supabase';
import { Booking, BookingService, GroupMember, BookingStatus, BookingFilters } from '../types/booking';

export const bookingsService = {
  async getBookings(tenantId: string, filters?: BookingFilters) {
    let query = supabase
      .from('bookings')
      .select('*, customer:customers(name)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters) {
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,booking_number.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`);
      }
      if (filters.upcoming) {
        query = query.gte('travel_date_start', new Date().toISOString().split('T')[0]);
      }
      if (filters.departing_soon) {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        query = query.gte('travel_date_start', today).lte('travel_date_start', nextWeek);
      }
    }

    const { data, error } = await query.order('travel_date_start', { ascending: true });
    if (error) throw error;
    return data as Booking[];
  },

  async getBookingById(id: string, tenantId: string) {
    // Use RPC if possible, otherwise manual fetch
    const { data: hub, error: rpcError } = await supabase.rpc('get_booking_hub', {
      p_tenant_id: tenantId,
      p_booking_id: id
    });

    if (rpcError) {
      console.warn('RPC hub failed, falling back to manual fetch', rpcError);
    }

    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        invoice:invoices(id, invoice_number, status, total_amount, amount_outstanding),
        quotation:quotations(id, quote_number),
        services:booking_services(*),
        members:group_booking_members(*),
        itinerary:itineraries(id, title, status, is_public, start_date)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (bError) throw bError;
    
    // Sort services and members
    if (booking.services) booking.services.sort((a: any, b: any) => a.sort_order - b.sort_order);
    if (booking.members) booking.members.sort((a: any, b: any) => a.sort_order - b.sort_order);
    
    return booking as Booking;
  },

  async createBooking(data: Partial<Booking>, services?: Partial<BookingService>[]) {
    const tenantId = data.tenant_id;
    if (!tenantId) throw new Error('Tenant ID required');

    // 1. Generate Booking Number
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    const year = new Date().getFullYear();
    const sequence = String((count || 0) + 1).padStart(4, '0');
    const bookingNumber = `BK-${year}-${sequence}`;

    const totalPax = (data.pax_adults || 0) + (data.pax_children || 0) + (data.pax_infants || 0);

    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert({
        ...data,
        booking_number: bookingNumber,
        total_pax: totalPax,
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bError) throw bError;

    if (services && services.length > 0) {
      const { error: sError } = await supabase
        .from('booking_services')
        .insert(services.map((s, i) => ({
          ...s,
          booking_id: booking.id,
          tenant_id: tenantId,
          sort_order: i
        })));
      if (sError) throw sError;
    }

    return booking as Booking;
  },

  async updateBooking(id: string, updates: Partial<Booking>) {
    if (updates.pax_adults !== undefined || updates.pax_children !== undefined || updates.pax_infants !== undefined) {
      const { data: current } = await supabase.from('bookings').select('*').eq('id', id).single();
      const a = updates.pax_adults ?? current.pax_adults;
      const c = updates.pax_children ?? current.pax_children;
      const i = updates.pax_infants ?? current.pax_infants;
      updates.total_pax = a + c + i;
    }

    if (updates.selling_price !== undefined || updates.cost_price !== undefined) {
      const { data: current } = await supabase.from('bookings').select('*').eq('id', id).single();
      const s = updates.selling_price ?? current.selling_price;
      const c = updates.cost_price ?? current.cost_price;
      updates.profit = s - c;
      updates.margin_percentage = s > 0 ? (updates.profit / s) * 100 : 0;
    }

    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: BookingStatus, reason?: string) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
        if (reason) updates.cancellation_reason = reason;
    }

    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (error) throw error;
  },

  async addService(bookingId: string, tenantId: string, service: Partial<BookingService>) {
    const { error } = await supabase.from('booking_services').insert({
      ...service,
      booking_id: bookingId,
      tenant_id: tenantId
    });
    if (error) throw error;
  },

  async deleteService(id: string) {
    const { error } = await supabase.from('booking_services').delete().eq('id', id);
    if (error) throw error;
  },

  async addMember(bookingId: string, tenantId: string, member: Partial<GroupMember>) {
    const { error } = await supabase.from('group_booking_members').insert({
      ...member,
      booking_id: bookingId,
      tenant_id: tenantId
    });
    if (error) throw error;
  },

  async deleteMember(id: string) {
    const { error } = await supabase.from('group_booking_members').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteBooking(id: string) {
    const { data: b } = await supabase.from('bookings').select('status, invoice_id').eq('id', id).single();
    if (b && b.status !== 'cancelled' && b.invoice_id) {
       throw new Error('Cannot delete a booking with a linked invoice. Cancel it instead.');
    }
    const { error } = await supabase.from('bookings').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
};
