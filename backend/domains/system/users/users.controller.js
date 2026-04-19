import usersService from './users.service.js';
import response from '../../../core/utils/responseHandler.js';
import { userInviteSchema, userUpdateSchema, meUpdateSchema } from './users.schema.js';

class UsersController {
  async getMe(req, res, next) {
    try {
      const data = await usersService.getMe(req.user.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const validated = meUpdateSchema.parse(req.body);
      const data = await usersService.updateMe(req.user.id, validated);
      return response.success(res, data, 'Profile updated successfully');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async listTeam(req, res, next) {
    try {
      const data = await usersService.listTeam(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async inviteUser(req, res, next) {
    try {
      const validated = userInviteSchema.parse(req.body);
      const data = await usersService.inviteUser(req.user.tenantId, req.user.id, validated);
      return response.success(res, data, 'User invited successfully', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const validated = userUpdateSchema.parse(req.body);
      const data = await usersService.updateUser(req.user.tenantId, req.params.userId, validated, req.user);
      return response.success(res, data, 'User updated successfully');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      await usersService.deactivateUser(req.user.tenantId, req.params.userId, req.user.id);
      return response.success(res, null, 'User deactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  async reactivateUser(req, res, next) {
    try {
      await usersService.reactivateUser(req.user.tenantId, req.params.userId, req.user.id);
      return response.success(res, null, 'User reactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
