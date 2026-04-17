import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';
import invoiceService from '../../finance/invoices/invoice.service.js';

/**
 * GroupBookingService — Collaborative Financial Distribution
 */
class GroupBookingService {
  /**
   * List of members in a group booking
   */
  async getMembers(tenantId, bookingId) {
    const { data, error } = await supabaseAdmin
      .from('group_booking_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('booking_id', bookingId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a new member with automatic total calculation
   */
  async addMember(tenantId, userId, bookingId, payload) {
    const member = {
      tenant_id: tenantId,
      booking_id: bookingId,
      member_name: payload.member_name,
      room_sharing: payload.room_sharing || null,
      add_ons: Array.isArray(payload.add_ons) ? payload.add_ons : [],
      base_cost: toAmount(payload.base_cost),
      room_upgrade: toAmount(payload.room_upgrade),
      created_by: userId
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
  async updateMember(tenantId, bookingId, memberId, payload) {
    const { data: current } = await supabaseAdmin
      .from('group_booking_members')
      .select('*')
      .eq('id', memberId)
      .eq('booking_id', bookingId)
      .eq('tenant_id', tenantId)
      .single();

    if (!current) throw new Error('Group member not found');

    const updates = {
      member_name: payload.member_name ?? current.member_name,
      room_sharing: payload.room_sharing ?? current.room_sharing,
      add_ons: Array.isArray(payload.add_ons) ? payload.add_ons : current.add_ons,
      base_cost: payload.base_cost !== undefined ? toAmount(payload.base_cost) : toAmount(current.base_cost),
      room_upgrade: payload.room_upgrade !== undefined ? toAmount(payload.room_upgrade) : toAmount(current.room_upgrade),
      updated_at: new Date().toISOString()
    };

    const totals = this._calculateMemberTotals(updates);
    Object.assign(updates, totals);

    const { data, error } = await supabaseAdmin
      .from('group_booking_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
