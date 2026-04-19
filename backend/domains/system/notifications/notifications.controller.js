import notificationService from './notifications.service.js';
import response from '../../../core/utils/responseHandler.js';

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const data = await notificationService.listNotifications(req.user.tenantId, req.user.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const data = await notificationService.markAsRead(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, data, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.tenantId, req.user.id);
      return response.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
