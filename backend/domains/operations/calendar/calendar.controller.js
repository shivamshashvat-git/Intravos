import calendarService from './calendar.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * CalendarController — Industrialized Multi-tenant Timeline Orchestration
 */
class CalendarController {
  
  /**
   * Aggregate Multi-module Events
   */
  async get__0(req, res, next) {
    try {
      const { from, to } = req.query;
      const features = req.tenant?.features_enabled || [];
      
      const events = await calendarService.getEvents(req.user.tenantId, from, to, features);
      
      return response.success(res, {
        events,
        total: events.length,
        from,
        to
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Persistence Sync: Refresh calendar_events cache
   */
  async post_sync_1(req, res, next) {
    try {
      // Authorization Check
      if (!['admin', 'super_admin'].includes(req.user.role)) {
        return response.error(res, 'Admin permissions required for sync', 403);
      }

      const features = req.tenant?.features_enabled || [];
      const result = await calendarService.syncPersistentEvents(req.user.tenantId, req.user.id, features);
      
      return response.success(res, result, 'Calendar cache synchronized successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarController();
