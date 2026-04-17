import expenseService from './expense.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * ExpensesController — Industrialized Operational Cost Management
 */
class ExpensesController {
  
  /**
   * List Categorization Options
   */
  async get_categories_0(req, res, next) {
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
  async post_categories_1(req, res, next) {
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
  async patch_categories__id_2(req, res, next) {
    try {
      const category = await expenseService.updateCategory(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Expenses with Financial Context
   */
  async get__4(req, res, next) {
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
  async post__5(req, res, next) {
    try {
      const expense = await expenseService.recordExpense(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { expense }, 'Expense recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reconcile / Amend Expense
   */
  async patch_id_6(req, res, next) {
    try {
      const expense = await expenseService.updateExpense(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { expense }, 'Expense updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reverse Expense Entry
   */
  async delete_id_7(req, res, next) {
    try {
      const result = await expenseService.deleteExpense(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, result, 'Expense record reversed');
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpensesController();
