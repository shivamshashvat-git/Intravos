import resourceService from './resources.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * ResourcesController — Industrialized Multi-Tenant Resource Hub
 */
class ResourcesController {
  
  async get_categories_0(req, res, next) {
    try {
      const data = await resourceService.listCategories(req.user.tenantId);
      return response.success(res, { categories: data });
    } catch (error) {
      next(error);
    }
  }

  async get__1(req, res, next) {
    try {
      const data = await resourceService.listResources(req.user.tenantId, req.query);
      return response.success(res, { resources: data });
    } catch (error) {
      next(error);
    }
  }

  async post__2(req, res, next) {
    try {
      const data = await resourceService.createResource(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { resource: data }, 'Resource link registered', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async patch_id_3(req, res, next) {
    try {
      const data = await resourceService.updateResource(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { resource: data }, 'Resource metadata updated');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post_id_use_4(req, res, next) {
    try {
      const data = await resourceService.trackUsage(req.user.tenantId, req.params.id);
      return response.success(res, data, 'Resource usage tallied');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async delete_id_5(req, res, next) {
    try {
      const result = await resourceService.deleteResource(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Custom resource not found', 404);
      return response.success(res, result, 'Resource record retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new ResourcesController();
