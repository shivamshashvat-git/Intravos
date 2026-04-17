import followupService from './followup.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * FollowupsController — Industrialized Sales Engagement
 */
class FollowupsController {
  
  /**
   * List Pending Engagement Actions
   */
  async get__0(req, res, next) {
    try {
      const data = await followupService.listFollowups(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Orchestrate New Follow-up
   */
  async post__1(req, res, next) {
    try {
      const followup = await followupService.createFollowup(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { followup }, 'Follow-up created', 201);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Transition Engagement State
   */
  async patch_id_2(req, res, next) {
    try {
      const followup = await followupService.updateFollowup(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, { followup });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Retire Follow-up Entry
   */
  async delete_id_3(req, res, next) {
    try {
      const result = await followupService.deleteFollowup(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Follow-up not found', 404);
      return response.success(res, result, 'Follow-up retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new FollowupsController();
