import taskService from './tasks.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * TasksController — Industrialized Workflow Orchestration
 */
class TasksController {
  
  async get__0(req, res, next) {
    try {
      const result = await taskService.listTasks(req.user.tenantId, req.query);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async post__1(req, res, next) {
    try {
      const data = await taskService.createTask(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { task: data }, 'Actionable task assigned', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_2(req, res, next) {
    try {
      const data = await taskService.updateTask(req.user.tenantId, req.params.id, req.body);
      if (!data) return response.error(res, 'Task not found', 404);
      return response.success(res, { task: data }, 'Task progress synchronized');
    } catch (error) {
      next(error);
    }
  }

  async delete_id_3(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Task not found', 404);
      return response.success(res, result, 'Task record retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new TasksController();
