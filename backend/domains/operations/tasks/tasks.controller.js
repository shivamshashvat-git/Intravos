
import taskService from './tasks.service.js';
import { taskSchema, updateTaskSchema, taskFiltersSchema } from './tasks.schema.js';
import response from '../../../core/utils/responseHandler.js';

class TaskController {
  async listTasks(req, res, next) {
    try {
      const filters = taskFiltersSchema.parse(req.query);
      const data = await taskService.listTasks(req.user.tenantId, filters);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const validated = taskSchema.parse(req.body);
      const data = await taskService.createTask(req.user.tenantId, req.user.id, validated);
      return response.success(res, data, 'Task created', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const validated = updateTaskSchema.parse(req.body);
      const data = await taskService.updateTask(req.user.tenantId, req.params.id, validated);
      return response.success(res, data, 'Task updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async completeTask(req, res, next) {
    try {
      const data = await taskService.completeTask(req.user.tenantId, req.params.id);
      return response.success(res, data, 'Task completed');
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.user.tenantId, req.params.id, req.user);
      return response.success(res, null, 'Task deleted');
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const data = await taskService.getAnalytics(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async triggerOverdueCheck(req, res, next) {
    try {
      const count = await taskService.checkOverdueTasks();
      return response.success(res, { processed_count: count }, 'Overdue check complete');
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
