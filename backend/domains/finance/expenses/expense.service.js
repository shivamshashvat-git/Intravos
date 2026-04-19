import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { toAmount } from '../../../core/utils/helpers.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

/**
 * ExpenseService — Cash Outflow & Operational Cost Orchestration
 */
class ExpenseService {
  /**
   * List Expense Categories
   */
  async listCategories(tenantId) {
    const { data, error } = await supabaseAdmin
      .from('expense_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Register Category
   */
  async createCategory(tenantId, payload) {
    const { name, is_default = false } = payload;
    if (!name) throw new Error('Category name is required');

    const { data, error } = await supabaseAdmin
      .from('expense_categories')
      .insert({ tenant_id: tenantId, name, is_default })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update Category Properties
   */
  async updateCategory(tenantId, categoryId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    const { data, error } = await supabaseAdmin
      .from('expense_categories')
      .update(updates)
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete Category
   */
  async deleteCategory(tenantId, userId, categoryId) {
    return await softDeleteDirect({
      table: 'expense_categories',
      id: categoryId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Expense Category'
    });
  }

  /**
   * List Expenses with Pagination & Multi-dimensional filters
   */
  async listExpenses(tenantId, filters) {
    const { lead_id, category_id, from, to, page = 1, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (category_id) query = query.eq('category_id', category_id);
    if (from) query = query.gte('expense_date', from);
    if (to) query = query.lte('expense_date', to);

    const { data, error, count } = await query;
    if (error) throw error;
    
    return {
      expenses: data || [],
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
  }

  /**
   * Record a new expense with atomic cash reconciliation
   */
  async recordExpense(tenantId, userId, payload) {
    const amount = toAmount(payload.amount);
    if (!payload.description || amount <= 0) {
      throw new Error('Description and a positive amount are required');
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        ...payload,
        tenant_id: tenantId,
        amount,
        recorded_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Side-effect: Reconcile Bank Balance
    if (data.account_id) {
      await this._reconcileAccount(tenantId, data.account_id, -amount);
    }

    return data;
  }

  /**
   * Update expense with complex delta reconciliation
   */
  async updateExpense(tenantId, expenseId, payload) {
    const updates = { ...payload };
    delete updates.id;
    delete updates.tenant_id;

    // 1. Fetch current for delta calculation
    const { data: current } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (!current) throw new Error('Expense not found');

    // 2. Perform Update
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // 3. Balance Reconciliation Logic
    const oldAmount = toAmount(current.amount);
    const newAmount = toAmount(data.amount);

    if (current.account_id && current.account_id !== data.account_id) {
      // Account Changed: Revert old, Deduct new
      await this._reconcileAccount(tenantId, current.account_id, oldAmount);
      await this._reconcileAccount(tenantId, data.account_id, -newAmount);
    } else if (data.account_id) {
      // Amount Adjusted on same account
      await this._reconcileAccount(tenantId, data.account_id, oldAmount - newAmount);
    }

    return data;
  }

  /**
   * Delete expense and reverse cash outflow
   */
  async deleteExpense(tenantId, userId, expenseId) {
    const { data: current } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .eq('tenant_id', tenantId)
      .single();

    if (!current) throw new Error('Expense not found');

    const result = await softDeleteDirect({
      table: 'expenses',
      id: expenseId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Expense',
      select: 'id, description, amount, deleted_at'
    });

    if (result && current.account_id) {
      await this._reconcileAccount(tenantId, current.account_id, toAmount(current.amount));
    }

    return result;
  }

  // --- INTERNAL ---

  async _reconcileAccount(tenantId, accountId, delta) {
    if (!accountId || delta === 0) return;

    const { data: account } = await supabaseAdmin
      .from('bank_accounts')
      .select('id, running_balance')
      .eq('id', accountId)
      .eq('tenant_id', tenantId)
      .single();

    if (!account) return;

    await supabaseAdmin
      .from('bank_accounts')
      .update({ running_balance: toAmount(account.running_balance) + delta })
      .eq('id', accountId)
      .eq('tenant_id', tenantId);
  }
}

export default new ExpenseService();
