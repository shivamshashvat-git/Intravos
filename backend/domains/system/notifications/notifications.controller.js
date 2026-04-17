import notificationService from './notifications.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * NotificationsController — Industrialized Multi-Tenant Alerting
 */
class NotificationsController {
  
  async get_all(req, res, next) {
    try {
      const result = await notificationService.listNotifications(req.user.tenantId, req.user.id, req.query);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async patch_read(req, res, next) {
    try {
      const data = await notificationService.markAsRead(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { notification: data }, 'Alert acknowledged');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async patch_read_all(req, res, next) {
    try {
      const data = await notificationService.markAllAsRead(req.user.tenantId, req.user.id);
      return response.success(res, data, 'All alerts marked as acknowledged');
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationsController();
