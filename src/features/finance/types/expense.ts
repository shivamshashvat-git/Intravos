export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  category_id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  status: ExpenseStatus;
  receipt_url?: string;
  vendor?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category?: ExpenseCategory;
}

export interface CreateExpenseInput {
  category_id: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  receipt_url?: string;
  status?: ExpenseStatus;
}
