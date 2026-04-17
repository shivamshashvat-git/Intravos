import engagementService from './engagement.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * EngagementController — Industrialized CRM Relationship Orchestration
 */
class EngagementController {
  
  async get_feed(req, res, next) {
    try {
      const data = await engagementService.getFeed(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get_templates(req, res, next) {
    try {
      const data = await engagementService.getTemplates(req.user.tenantId);
      return response.success(res, { templates: data });
    } catch (error) {
      next(error);
    }
  }

  async post_templates(req, res, next) {
    try {
      const data = await engagementService.createTemplate(req.user.tenantId, req.body);
      return response.success(res, { template: data }, 'Message template created', 201);
    } catch (error) {
      next(error);
    }
  }

  async post_send(req, res, next) {
    try {
      const data = await engagementService.recordEngagement(req.user.tenantId, req.user.id, req.body);
      return response.success(res, data, 'Engagement intent recorded');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new EngagementController();
