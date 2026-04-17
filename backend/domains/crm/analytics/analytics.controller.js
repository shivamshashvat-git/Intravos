import analyticsService from './analytics.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * AnalyticsController — Industrialized Business Intelligence
 */
class AnalyticsController {
  
  async get_summary_0(req, res, next) {
    try {
      const summary = await analyticsService.getSummary(
        req.user.tenantId,
        req.user.role,
        req.tenant.created_at,
        req.tenant.plan
      );
      return response.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async get_pnl_monthly_1(req, res, next) {
    try {
      const data = await analyticsService.getMonthlyPnl(req.user.tenantId);
      return response.success(res, { monthly_pnl: data });
    } catch (error) {
      next(error);
    }
  }

  async get_founding_stats_14(req, res, next) {
    try {
      const stats = await analyticsService.getPlatformStats();
      return response.success(res, { platform_stats: stats });
    } catch (error) {
      next(error);
    }
  }

  async get_vendor_reconciliation_3(req, res, next) {
    try {
      const data = await analyticsService.getVendorReconciliation(req.user.tenantId);
      return response.success(res, { vendor_reconciliation: data });
    } catch (error) {
      next(error);
    }
  }

  async get_export_csv_15(req, res, next) {
    try {
      const { module = 'customers' } = req.query;
      const data = await analyticsService.getExportData(req.user.tenantId, module);

      // CSV exports return raw text, as they are used for direct downloads
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${module}_export.csv"`);
      
      // Basic CSV construction (Service should Ideally handle text conversion too)
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
      
      res.send(`${headers}\n${rows}`);
    } catch (error) {
      if (error.message.includes('No data')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new AnalyticsController();
