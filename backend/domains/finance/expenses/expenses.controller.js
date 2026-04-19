import { expenseSchema, updateExpenseSchema } from './expenses.schema.js';
import expenseService from './expense.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * ExpensesController — Industrialized Operational Cost Management
 */
class ExpensesController {
  
  /**
   * List Categorization Options
   */
  async listCategories(req, res, next) {
    try {
      const categories = await expenseService.listCategories(req.user.tenantId);
      return response.success(res, { categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register New Expense Type
   */
  async createCategory(req, res, next) {
    try {
      const category = await expenseService.createCategory(req.user.tenantId, req.body);
      return response.success(res, { category }, 'Category created', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modify Category Metadata
   */
  async updateCategory(req, res, next) {
    try {
      const category = await expenseService.updateCategory(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove Expense Type
   */
  async deleteCategory(req, res, next) {
    try {
      const result = await expenseService.deleteCategory(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, result, 'Category removed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Expenses with Financial Context
   */
  async listExpenses(req, res, next) {
    try {
      const data = await expenseService.listExpenses(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record Operational Outflow
   */
  async recordExpense(req, res, next) {
    try {
      const validated = expenseSchema.parse(req.body);
      const expense = await expenseService.recordExpense(req.user.tenantId, req.user.id, validated);
      return response.success(res, { expense }, 'Expense recorded', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  /**
   * Reconcile / Amend Expense
   */
  async updateExpense(req, res, next) {
    try {
      const validated = updateExpenseSchema.parse(req.body);
      const expense = await expenseService.updateExpense(req.user.tenantId, req.params.id, validated);
      return response.success(res, { expense }, 'Expense updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  /**
   * Reverse Expense Entry
   */
  async deleteExpense(req, res, next) {
    try {
      const result = await expenseService.deleteExpense(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, result, 'Expense record reversed');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpensesController();
