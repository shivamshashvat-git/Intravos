import tenantService from './tenant.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * TenantsController — Industrialized Agency Administration
 */
class TenantsController {
  
  async get_me(req, res, next) {
    try {
      const data = await tenantService.getTenant(req.user.tenantId);
      return response.success(res, { tenant: data });
    } catch (error) {
      next(error);
    }
  }

  async patch_me(req, res, next) {
    try {
      const data = await tenantService.updateTenant(req.user.tenantId, req.body);
      return response.success(res, { tenant: data }, 'Agency configuration synchronized');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post_coupons_validate(req, res, next) {
    try {
      const data = await tenantService.validateCoupon(req.body.coupon_code);
      return response.success(res, { coupon: data }, 'Coupon criteria met');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('Invalid') || error.message.includes('expired')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async get_changelog(req, res, next) {
    try {
      const data = await tenantService.getChangelog(req.query.limit);
      return response.success(res, { changelog: data });
    } catch (error) {
      next(error);
    }
  }

  async get_stats(req, res, next) {
    try {
      const data = await tenantService.getDashboardStats(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantsController();
