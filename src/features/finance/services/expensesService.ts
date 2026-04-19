import { apiClient } from '@/core/lib/apiClient';
import { Expense, ExpenseCategory, CreateExpenseInput } from '../types/expense';

const BASE_URL = '/api/finance/expenses';

export const expensesService = {
  async getExpenses(filters: any = {}): Promise<{ expenses: Expense[], total: number }> {
    const params = new URLSearchParams();
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient(`${BASE_URL}?${params.toString()}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch expenses');
    }
    
    const { data } = await response.json();
    return {
      expenses: data.expenses || [],
      total: data.total || 0
    };
  },

  async getCategories(): Promise<ExpenseCategory[]> {
    const response = await apiClient(`${BASE_URL}/categories`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch expense categories');
    }
    
    const { data } = await response.json();
    return data.categories || [];
  },

  async recordExpense(data: CreateExpenseInput): Promise<Expense> {
    const response = await apiClient(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record expense');
    }
    
    const { data: result } = await response.json();
    return result.expense;
  },

  async updateExpense(id: string, data: Partial<CreateExpenseInput>): Promise<Expense> {
    const response = await apiClient(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update expense');
    }
    
    const { data: result } = await response.json();
    return result.expense;
  },

  async deleteExpense(id: string): Promise<void> {
    const response = await apiClient(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete expense');
    }
  }
};
