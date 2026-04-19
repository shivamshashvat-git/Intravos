import dashboardService from './dashboard.service.js';
import { dashboardFiltersSchema } from './dashboard.schema.js';
import response from '../../../core/utils/responseHandler.js';

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const data = await dashboardService.getDashboardStats(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async refreshDashboard(req, res, next) {
    try {
      const data = await dashboardService.refreshDashboardStats(req.user.tenantId);
      return response.success(res, data, 'Dashboard stats refreshed');
    } catch (error) {
      next(error);
    }
  }

  async getPerformance(req, res, next) {
    try {
      const { period } = dashboardFiltersSchema.parse(req.query);
      const data = await dashboardService.getPerformanceMetrics(req.user.tenantId, period);
      return response.success(res, data);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async getTopPerformers(req, res, next) {
    try {
      const { period } = dashboardFiltersSchema.parse(req.query);
      const data = await dashboardService.getTopPerformers(req.user.tenantId, period);
      return response.success(res, data);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }
}

export default new DashboardController();
