import { useState, useEffect, useCallback } from 'react';
import { expensesService } from '../services/expensesService';
import { Expense, ExpenseCategory, CreateExpenseInput } from '../types/expense';
import { toast } from 'sonner';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    category_id: '',
    status: '',
    search: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 50
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { expenses: data, total: totalCount } = await expensesService.getExpenses(filters);
      setExpenses(data);
      setTotal(totalCount);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await expensesService.getCategories();
      setCategories(data);
    } catch (e: any) {
      console.error('Failed to fetch categories:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const recordExpense = async (data: CreateExpenseInput) => {
    try {
      await expensesService.recordExpense(data);
      toast.success('Expense recorded');
      await fetchExpenses();
    } catch (e: any) {
      toast.error(e.message || 'Failed to record expense');
      throw e;
    }
  };

  const updateExpense = async (id: string, data: Partial<CreateExpenseInput>) => {
    try {
      await expensesService.updateExpense(id, data);
      toast.success('Expense updated');
      await fetchExpenses();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update expense');
      throw e;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await expensesService.deleteExpense(id);
      toast.success('Expense deleted');
      await fetchExpenses();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete expense');
      throw e;
    }
  };

  return {
    expenses,
    categories,
    loading,
    total,
    filters,
    setFilters,
    recordExpense,
    updateExpense,
    deleteExpense,
    refresh: fetchExpenses
  };
};
