import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';
import { pushPaymentReceived } from '../../../providers/communication/pushService.js';

/**
 * PaymentService — Multi-tenant Ledger & Financial Synchronization
 */
class PaymentService {
  /**
   * Record a payment from/to a customer
   */
  async recordCustomerPayment(tenantId, userId, payload) {
    const amount = toAmount(payload.amount);
    if (amount <= 0) throw new Error('Payment amount must be positive');

    const direction = payload.direction || (payload.is_refund ? 'out' : 'in');

    // 1. Integrity Check: Refund Loophole
    if (direction === 'out') {
      await this._validateRefund(tenantId, payload.invoice_id, payload.lead_id, amount);
    }

    // 2. Record Transaction
    const { data: trx, error } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        ...payload,
        tenant_id: tenantId,
        amount,
        direction,
        recorded_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Chain Reaction: Update Ledgers
    await Promise.all([
      this._syncLeadCollected(tenantId, trx.lead_id, amount, direction),
      this._syncInvoicePaid(tenantId, trx.invoice_id, amount, direction),
      this._syncBankAccount(tenantId, trx.account_id, amount, direction),
      this._checkMilestone(userId),
      this._triggerNotification(tenantId, trx)
    ]);

    return trx;
  }

  /**
   * Record a payment to a supplier (Vendor Payout)
   */
  async recordSupplierPayment(tenantId, userId, payload) {
    const amount = toAmount(payload.amount);
    const serviceId = payload.booking_service_id;
    
    // 1. Resolve Scope
    let service = null;
    if (serviceId) {
      const { data } = await supabaseAdmin.from('booking_services').select('*').eq('id', serviceId).single();
      service = data;
    }

    const vendorId = payload.vendor_id || service?.supplier_id;
    if (!vendorId) throw new Error('Supplier identification required for payout');

    // 2. Insert Transaction
    const { data: trx, error } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        ...payload,
        tenant_id: tenantId,
        amount,
        direction: 'out',
        vendor_id: vendorId,
        recorded_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Chain Reaction: Supplier Balances
    await Promise.all([
      this._syncSupplierService(tenantId, service, amount),
      this._syncSupplierDirectory(tenantId, vendorId, amount, service),
      this._syncBankAccount(tenantId, trx.account_id, amount, 'out')
    ]);

    return trx;
  }

  // --- INTERNAL SYNCHRONIZERS ---

  async _validateRefund(tenantId, invoiceId, leadId, amount) {
    if (invoiceId) {
      const { data } = await supabaseAdmin.from('invoices').select('amount_paid').eq('id', invoiceId).single();
      if (data && amount > toAmount(data.amount_paid)) throw new Error('Refund exceeds invoice paid amount');
    } else if (leadId) {
      const { data } = await supabaseAdmin.from('leads').select('amount_collected').eq('id', leadId).single();
      if (data && amount > toAmount(data.amount_collected)) throw new Error('Refund exceeds lead collected amount');
    }
  }

  async _syncLeadCollected(tenantId, leadId, amount, direction) {
    if (!leadId) return;
    const { data: lead } = await supabaseAdmin.from('leads').select('amount_collected').eq('id', leadId).single();
    if (!lead) return;
    const delta = direction === 'out' ? -amount : amount;
    await supabaseAdmin.from('leads').update({ amount_collected: Math.max(0, toAmount(lead.amount_collected) + delta) }).eq('id', leadId);
  }

  async _syncInvoicePaid(tenantId, invoiceId, amount, direction) {
    if (!invoiceId) return;
    const { data: inv } = await supabaseAdmin.from('invoices').select('id, total, amount_paid, status').eq('id', invoiceId).single();
    if (!inv) return;
    const delta = direction === 'out' ? -amount : amount;
    const newPaid = Math.max(0, toAmount(inv.amount_paid) + delta);
    await supabaseAdmin.from('invoices').update({ 
      amount_paid: newPaid,
      status: this._nextInvoiceStatus(inv, newPaid)
    }).eq('id', invoiceId);
  }

  async _syncBankAccount(tenantId, accountId, amount, direction) {
    if (!accountId) return;
    const { data: acc } = await supabaseAdmin.from('bank_accounts').select('running_balance').eq('id', accountId).single();
    if (!acc) return;
    const delta = direction === 'out' ? -amount : amount;
    await supabaseAdmin.from('bank_accounts').update({ running_balance: toAmount(acc.running_balance) + delta }).eq('id', accountId);
  }

  async _syncSupplierService(tenantId, service, amount) {
    if (!service) return;
    const newPaid = toAmount(service.paid_to_supplier_amount) + amount;
    await supabaseAdmin.from('booking_services').update({
      paid_to_supplier_amount: newPaid,
      supplier_payment_status: this._nextSupplierStatus(service, newPaid),
      last_payment_date: new Date().toISOString().split('T')[0]
    }).eq('id', service.id);
  }

  async _syncSupplierDirectory(tenantId, vendorId, amount, service) {
    const { data: v } = await supabaseAdmin.from('agents_directory').select('*').eq('id', vendorId).single();
    if (!v) return;
    
    await supabaseAdmin.from('agents_directory').update({
      outstanding_payables: Math.max(0, toAmount(v.outstanding_payables) - amount),
      total_business_value: toAmount(v.total_business_value) + amount,
      commission_earned: toAmount(v.commission_earned) + (service ? toAmount(service.commission_amount) : 0)
    }).eq('id', vendorId);
  }

  /**
   * List transactions with multi-tenant filtering and pagination
   */
  async listTransactions(tenantId, filters) {
    const { lead_id, page = 1, limit = 50 } = filters;
    let query = supabaseAdmin
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);

    const { data, error, count } = await query;
    if (error) throw error;

    return { payments: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Orchestrate data required for payment reminders
   */
  async getReminderData(tenantId, leadId, amount) {
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('customer_name, customer_phone, destination')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single();

    if (!lead) throw new Error('Lead not found');

    const { data: tenant } = await supabaseAdmin.from('tenants').select('name, invoice_bank_text').eq('id', tenantId).single();

    return {
      customer_name: lead.customer_name,
      customer_phone: lead.customer_phone,
      agency_name: tenant?.name || 'Intravos Travel',
      amount: amount || '0',
      destination: lead.destination || 'your trip',
      bank_details: tenant?.invoice_bank_text || ''
    };
  }

  /**
   * Fetch hydrated transaction for receipt generation
   */
  async getReceiptData(tenantId, transactionId) {
    const { data: payment, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*, leads(customer_name, destination), invoices(invoice_number), bank_accounts(account_name, bank_name)')
      .eq('id', transactionId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !payment) throw new Error('Payment not found');
    return payment;
  }

  /**
   * List configured bank accounts
   */
  async listBankAccounts(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('account_name');

    if (error) throw error;
    return data || [];
  }

  // --- HELPERS ---

  _nextInvoiceStatus(invoice, paid) {
    if (invoice.status === 'cancelled') return 'cancelled';
    if (paid <= 0) return 'unpaid';
    if (paid >= toAmount(invoice.total)) return 'paid';
    return 'partially_paid';
  }

  _nextSupplierStatus(service, paid) {
    const cost = toAmount(service.cost_to_agency);
    if (paid <= 0) return 'unpaid';
    if (cost > 0 && paid >= cost) return 'fully_paid';
    return 'partially_paid';
  }

  async _checkMilestone(userId) {
    const { data: u } = await supabaseAdmin.from('users').select('milestones').eq('id', userId).single();
    if (u && !(u.milestones || []).includes('first_payment')) {
      await supabaseAdmin.from('users').update({ milestones: [...(u.milestones || []), 'first_payment'] }).eq('id', userId);
    }
  }

  async _triggerNotification(tenantId, trx) {
    if (trx.direction === 'in' && trx.lead_id) {
      const { data: lead } = await supabaseAdmin.from('leads').select('assigned_to, customer_name').eq('id', trx.lead_id).single();
      if (lead?.assigned_to) {
        pushPaymentReceived(tenantId, lead.assigned_to, { ...trx, customer_name: lead.customer_name }).catch(() => {});
      }
    }
  }
}

export default new PaymentService();
