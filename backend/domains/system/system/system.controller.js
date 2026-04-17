import systemService from './system.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * SystemController — Industrialized Infrastructure Configuration
 */
class SystemController {
  
  async get_settings(req, res, next) {
    try {
      const data = await systemService.getTenantSettings(req.user.tenantId);
      return response.success(res, { settings: data });
    } catch (error) {
      next(error);
    }
  }

  async patch_settings(req, res, next) {
    try {
      const data = await systemService.updateTenantFeatures(req.user.userRole, req.body.target_tenant_id, req.body.features_enabled);
      return response.success(res, { settings: data }, 'Infrastructure entitlements synchronized');
    } catch (error) {
      if (error.message.includes('Super Admin')) return response.error(res, error.message, 403);
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new SystemController();
