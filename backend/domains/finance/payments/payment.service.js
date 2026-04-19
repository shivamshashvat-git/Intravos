import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';
import { pushPaymentReceived } from '../../../providers/communication/pushService.js';
import invoiceService from '../invoices/invoice.service.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

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

    // 1. Record Transaction
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

    // 2. Chain Reaction: Centralized Financial Recalculation
    const tasks = [];
    if (trx.invoice_id) tasks.push(invoiceService.recalculate(tenantId, trx.invoice_id));
    if (trx.lead_id) tasks.push(this._syncLeadCollected(tenantId, trx.lead_id));
    if (trx.account_id) tasks.push(this._syncBankAccount(tenantId, trx.account_id, amount, direction));
    
    tasks.push(this._auditPayment(tenantId, userId, trx));
    tasks.push(this._triggerNotification(tenantId, trx));

    await Promise.allSettled(tasks);

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
      const { data } = await supabaseAdmin
        .from('booking_services')
        .select('*')
        .eq('id', serviceId)
        .eq('tenant_id', tenantId)
        .single();
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
    await Promise.allSettled([
      this._syncSupplierService(tenantId, service, amount),
      this._syncSupplierDirectory(tenantId, vendorId, amount, service),
      this._syncBankAccount(tenantId, trx.account_id, amount, 'out'),
      this._auditPayment(tenantId, userId, trx)
    ]);

    return trx;
  }

  /**
   * Update payment record
   */
  async updatePayment(tenantId, userId, paymentId, payload) {
    const oldSnapshot = await this.getReceiptData(tenantId, paymentId);
    if (!oldSnapshot) throw new Error('Payment not found');

    const { data: trx, error } = await supabaseAdmin
      .from('payment_transactions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // Re-trigger sync if amount or invoice/lead changed
    if (trx.invoice_id) await invoiceService.recalculate(tenantId, trx.invoice_id);
    if (oldSnapshot.invoice_id && oldSnapshot.invoice_id !== trx.invoice_id) {
       await invoiceService.recalculate(tenantId, oldSnapshot.invoice_id);
    }

    return trx;
  }

  /**
   * Delete payment
   */
  async deletePayment(tenantId, paymentId) {
    const payment = await this.getReceiptData(tenantId, paymentId);
    const result = await softDeleteDirect({ table: 'payment_transactions', id: paymentId, tenantId });
    
    if (payment?.invoice_id) {
      await invoiceService.recalculate(tenantId, payment.invoice_id);
    }
    
    return result;
  }

  // --- INTERNAL SYNCHRONIZERS ---

  async _syncLeadCollected(tenantId, leadId) {
    if (!leadId) return;
    
    const { data: payments } = await supabaseAdmin
      .from('payment_transactions')
      .select('amount, direction')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const totalCollected = (payments || []).reduce((sum, p) => {
      return p.direction === 'in' ? sum + parseFloat(p.amount) : sum - parseFloat(p.amount);
    }, 0);

    await supabaseAdmin
      .from('leads')
      .update({ amount_collected: Math.max(0, totalCollected) })
      .eq('id', leadId)
      .eq('tenant_id', tenantId);
  }

  async _syncBankAccount(tenantId, accountId, amount, direction) {
    if (!accountId) return;
    const { data: acc } = await supabaseAdmin
      .from('bank_accounts')
      .select('running_balance')
      .eq('id', accountId)
      .eq('tenant_id', tenantId)
      .single();
    if (!acc) return;
    const delta = direction === 'out' ? -amount : amount;
    await supabaseAdmin
      .from('bank_accounts')
      .update({ running_balance: toAmount(acc.running_balance) + delta })
      .eq('id', accountId)
      .eq('tenant_id', tenantId);
  }

  async _syncSupplierService(tenantId, service, amount) {
    if (!service) return;
    const { data: currentService } = await supabaseAdmin.from('booking_services').select('paid_to_supplier_amount, cost_to_agency').eq('id', service.id).single();
    if (!currentService) return;

    const newPaid = toAmount(currentService.paid_to_supplier_amount) + amount;
    const cost = toAmount(currentService.cost_to_agency);
    
    let status = 'unpaid';
    if (newPaid >= cost && cost > 0) status = 'fully_paid';
    else if (newPaid > 0) status = 'partially_paid';

    await supabaseAdmin
      .from('booking_services')
      .update({
        paid_to_supplier_amount: newPaid,
        supplier_payment_status: status,
        last_payment_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', service.id)
      .eq('tenant_id', tenantId);
  }

  async _syncSupplierDirectory(tenantId, vendorId, amount, service) {
    const { data: v } = await supabaseAdmin
      .from('agents_directory')
      .select('*')
      .eq('id', vendorId)
      .eq('tenant_id', tenantId)
      .single();
    if (!v) return;
    
    await supabaseAdmin
      .from('agents_directory')
      .update({
        outstanding_payables: Math.max(0, toAmount(v.outstanding_payables) - amount),
        total_payouts: toAmount(v.total_payouts) + amount
      })
      .eq('id', vendorId)
      .eq('tenant_id', tenantId);
  }

  /**
   * List transactions with multi-tenant filtering and pagination
   */
  async listTransactions(tenantId, filters) {
    const { lead_id, invoice_id, category, page = 1, limit = 50 } = filters;
    let query = supabaseAdmin
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (invoice_id) query = query.eq('invoice_id', invoice_id);
    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;

    return { payments: data, total: count, page: parseInt(page, 10) };
  }

  /**
   * Fetch hydrated transaction for receipt generation
   */
  async getReceiptData(tenantId, transactionId) {
    const { data: payment, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*, leads(customer_name, destination), invoices(id, invoice_number), bank_accounts(account_name, bank_name)')
      .eq('id', transactionId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !payment) return null;
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

  async _auditPayment(tenantId, userId, trx) {
    await supabaseAdmin.from('financial_audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'payment',
      entity_id: trx.id,
      field_changed: 'amount',
      old_value: '0',
      new_value: trx.amount,
      snapshot_after: trx,
      changed_by: userId
    });
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
