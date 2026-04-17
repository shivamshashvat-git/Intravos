import workspaceService from './workspace.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * WorkspaceController — Industrialized Team Collaboration
 */
class WorkspaceController {
  
  async getMessages(req, res, next) {
    try {
      const data = await workspaceService.getMessages(req.user.tenantId, req.query);
      return response.success(res, { messages: data });
    } catch (error) {
      next(error);
    }
  }

  async postMessage(req, res, next) {
    try {
      const data = await workspaceService.sendMessage(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { message: data }, 'Collaboration note recorded', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new WorkspaceController();
