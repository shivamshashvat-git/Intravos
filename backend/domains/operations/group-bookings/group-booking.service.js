import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';
import invoiceService from '../../finance/invoices/invoice.service.js';

/**
 * GroupBookingService — Collaborative Financial Distribution
 */
class GroupBookingService {
  /**
   * List Group Bookings with financial aggregation
   */
  async listGroups(tenantId, filters = {}) {
    let query = supabaseAdmin
      .from('bookings')
      .select('*, itineraries(title)')
      .eq('tenant_id', tenantId)
      .eq('is_group', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,booking_ref.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate stats for each group
    const groups = await Promise.all((data || []).map(async (g) => {
      const { data: members } = await supabaseAdmin
        .from('group_booking_members')
        .select('per_person_total, invoice_id')
        .eq('booking_id', g.id)
        .is('deleted_at', null);

      const memberCount = (members || []).length;
      const totalPax = (members || []).reduce((sum, m) => sum + (m.pax || 1), 0);
      const totalValue = (members || []).reduce((sum, m) => sum + toAmount(m.per_person_total), 0);

      return {
        ...g,
        group_name: g.title,
        group_ref: g.booking_ref,
        departure_date: g.travel_start_date || g.travel_date_start,
        member_count: memberCount,
        total_pax: totalPax,
        financials: {
           total_invoiced: totalValue,
           total_paid: 0, // Simplified for now
           total_outstanding: totalValue
        }
      };
    }));

    return groups;
  }

  /**
   * Get exhaustive Group detail with member manifest
   */
  async getGroupDetail(tenantId, groupId) {
    const { data: group, error } = await supabaseAdmin
      .from('bookings')
      .select('*, itineraries(title)')
      .eq('id', groupId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error || !group) throw new Error('Group not found');

    const members = await this.getMembers(tenantId, groupId);

    return {
      ...group,
      group_name: group.title,
      group_ref: group.booking_ref,
      departure_date: group.travel_start_date || group.travel_date_start,
      members,
      financials: {
        total_invoiced: members.reduce((sum, m) => sum + toAmount(m.per_person_total), 0),
        total_paid: 0,
        total_outstanding: members.reduce((sum, m) => sum + toAmount(m.per_person_total), 0)
      }
    };
  }

  /**
   * Initialize a new Group Operation
   */
  async createGroup(tenantId, userId, payload) {
    const booking_ref = `GRP-${Date.now()}`;
    const { data: group, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        booking_ref,
        title: payload.group_name,
        travel_start_date: payload.departure_date,
        travel_end_date: payload.return_date,
        itinerary_id: payload.itinerary_id,
        status: 'confirmed',
        is_group: true
      })
      .select()
      .single();

    if (error) throw error;

    // Add initial members if provided
    if (Array.isArray(payload.members) && payload.members.length > 0) {
      for (const m of payload.members) {
        await this.addMember(tenantId, group.id, {
          member_name: m.name,
          customer_id: m.id,
          pax: m.pax || 1,
          base_cost: 0
        }, userId);
      }
    }

    return group;
  }

  /**
   * Detach member from Group
   */
  async removeMember(tenantId, bookingId, memberId) {
    const { error } = await supabaseAdmin
      .from('group_booking_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('booking_id', bookingId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  /**
   * List of members in a group booking
   */
  async getBookingMembers(tenantId, bookingId) {
    const { data, error } = await supabaseAdmin
      .from('group_booking_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('booking_id', bookingId)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a new member with automatic total calculation
   */
  async addMember(tenantId, bookingId, payload, userId) {
    // Industrial ID Resolution
    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualUserId = userRec?.id || userId;

    const member = {
      tenant_id: tenantId,
      booking_id: bookingId,
      member_name: payload.name || payload.member_name,
      room_sharing: payload.room_sharing || null,
      add_ons: Array.isArray(payload.add_ons) ? payload.add_ons : [],
      base_cost: toAmount(payload.base_cost),
      room_upgrade: toAmount(payload.room_upgrade),
      created_by: actualUserId
    };

    const totals = this._calculateMemberTotals(member);
    Object.assign(member, totals);

    const { data, error } = await supabaseAdmin
      .from('group_booking_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Recalculate all members and return group total
   */
  async recalculateGroup(tenantId, bookingId) {
    const members = await this.getMembers(tenantId, bookingId);
    const recalculated = [];

    for (const member of members) {
      const updates = this._calculateMemberTotals(member);
      const { data } = await supabaseAdmin
        .from('group_booking_members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', member.id)
        .select()
        .single();
      recalculated.push(data);
    }

    const groupTotal = recalculated.reduce((sum, item) => sum + toAmount(item.per_person_total), 0);
    return { members: recalculated, group_total: groupTotal };
  }

  /**
   * Bulk generate individual invoices for group members
   */
  async bulkGenerateInvoices(tenantId, userId, bookingId) {
    const { data: booking } = await supabaseAdmin.from('bookings').select('id, destination, booking_ref, customer_id').eq('id', bookingId).single();
    if (!booking) throw new Error('Booking not found');

    const members = await this.getMembers(tenantId, bookingId);
    const pendingMembers = members.filter(m => !m.invoice_id);
    
    if (pendingMembers.length === 0) return { message: 'All members already invoiced' };

    const created = [];
    for (const member of pendingMembers) {
      // Use InvoiceService for consistent invoice generation
      const invoice = await invoiceService.createInvoice(tenantId, userId, {
        customer_id: booking.customer_id,
        customer_name: member.member_name,
        gst_type: 'cgst_sgst', // Default for group bookings
        items: [{
          description: `Group booking share - ${booking.destination || booking.booking_ref}`,
          amount: toAmount(member.per_person_total),
          gst_rate: 5
        }]
      });

      await supabaseAdmin
        .from('group_booking_members')
        .update({ invoice_id: invoice.id, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      created.push(invoice);
    }

    return { invoices: created, count: created.length };
  }

  /**
   * Update member details with live financial recalculation
   */
  async updateMember(tenantId, memberId, payload) {
    const { data: current } = await supabaseAdmin
      .from('group_booking_members')
      .select('*')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single();

    if (!current) throw new Error('Group member not found');

    const updates = {
      ...payload,
      updated_at: new Date().toISOString()
    };

    if (payload.base_cost !== undefined || payload.room_upgrade !== undefined || payload.add_ons) {
        const base = payload.base_cost !== undefined ? toAmount(payload.base_cost) : toAmount(current.base_cost);
        const upgrade = payload.room_upgrade !== undefined ? toAmount(payload.room_upgrade) : toAmount(current.room_upgrade);
        const addOns = Array.isArray(payload.add_ons) ? payload.add_ons : current.add_ons;
        
        const totals = this._calculateMemberTotals({ base_cost: base, room_upgrade: upgrade, add_ons: addOns });
        Object.assign(updates, totals);
    }

    const { data, error } = await supabaseAdmin
      .from('group_booking_members')
      .update(updates)
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Standalone delete member
   */
  async deleteMember(tenantId, memberId) {
    const { error } = await supabaseAdmin
      .from('group_booking_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  // --- INTERNAL ---

  _calculateMemberTotals(member) {
    const base = toAmount(member.base_cost);
    const upgrade = toAmount(member.room_upgrade);
    const addOns = Array.isArray(member.add_ons) ? member.add_ons : [];
    const addOnSum = addOns.reduce((sum, a) => sum + toAmount(a.amount || a.cost || 0), 0);
    
    const perPersonTotal = base + upgrade + addOnSum;
    return {
      add_on_total: addOnSum,
      per_person_total: perPersonTotal
    };
  }
}

export default new GroupBookingService();
