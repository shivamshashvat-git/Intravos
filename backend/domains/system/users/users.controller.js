import userService from './user.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * UsersController — Industrialized Identity Orchestration
 */
class UsersController {
  
  async get__0(req, res, next) {
    try {
      const data = await userService.listUsers(req.user.role, req.user.tenantId);
      return response.success(res, { users: data });
    } catch (error) {
      next(error);
    }
  }

  async get_me_summary_1(req, res, next) {
    try {
      const data = await userService.getProfile(req.user.id, req.tenant);
      return response.success(res, data);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post__2(req, res, next) {
    try {
      const data = await userService.provisionUser(req.user, req.body);
      return response.success(res, data, 'User provisioned successfully', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('Cannot assign')) return response.error(res, error.message, 403);
      if (error.message.includes('Seat limit')) return response.error(res, error.message, 403);
      next(error);
    }
  }

  async patch_id_3(req, res, next) {
    try {
      const data = await userService.updateUser(req.user, req.params.id, req.body);
      return response.success(res, { user: data }, 'Profile updated');
    } catch (error) {
      if (error.message.includes('Cannot assign')) return response.error(res, error.message, 403);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async patch_id_features_4(req, res, next) {
    try {
      const data = await userService.manageFeatures(req.user, req.params.id, req.body.features);
      return response.success(res, { user: data }, `Features updated for ${data.name}`);
    } catch (error) {
      if (error.message.includes('permissions required')) return response.error(res, error.message, 403);
      if (error.message.includes('must be an array')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async patch_id_network_access_5(req, res, next) {
    try {
      const data = await userService.manageNetworkAccess(req.user, req.params.id, req.body.network_access);
      return response.success(res, { user: data }, `Network access ${data.network_access ? 'granted' : 'revoked'}`);
    } catch (error) {
      if (error.message.includes('permissions required')) return response.error(res, error.message, 403);
      if (error.message.includes('must be a boolean')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new UsersController();
