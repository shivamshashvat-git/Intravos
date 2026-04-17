import insuranceService from './insurance.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * InsuranceController — Industrialized Travel Protection Management
 */
class InsuranceController {
  
  /**
   * List Managed Protection Policies
   */
  async get__0(req, res, next) {
    try {
      const data = await insuranceService.listPolicies(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register New Coverage Entry
   */
  async post__1(req, res, next) {
    try {
      const policy = await insuranceService.recordPolicy(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { policy }, 'Insurance policy registered', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modify Coverage / Claim Status
   */
  async patch_id_2(req, res, next) {
    try {
      const policy = await insuranceService.updatePolicy(req.user.tenantId, req.params.id, req.body);
      if (!policy) return response.error(res, 'Insurance policy not found', 404);
      return response.success(res, { policy }, 'Insurance policy updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire Coverage Entry
   */
  async delete_id_3(req, res, next) {
    try {
      const result = await insuranceService.deletePolicy(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Insurance policy not found', 404);
      return response.success(res, result, 'Insurance policy retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new InsuranceController();
