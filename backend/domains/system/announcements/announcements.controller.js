import announcementService from './announcements.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * AnnouncementsController — Industrialized Communication Orchestration
 */
class AnnouncementsController {
  
  async get__0(req, res, next) {
    try {
      const data = await announcementService.listActiveAnnouncements(req.user.tenant_id, req.user.id);
      return response.success(res, { announcements: data });
    } catch (error) {
      next(error);
    }
  }

  async post_id_dismiss_1(req, res, next) {
    try {
      const data = await announcementService.dismissAnnouncement(req.user.id, req.params.id);
      return response.success(res, { dismissal: data }, 'Communication archived locally', 201);
    } catch (error) {
      next(error);
    }
  }

  async post__0(req, res, next) {
    try {
      const data = await announcementService.createAnnouncement(req.user.tenant_id, req.user.id, req.body);
      return response.success(res, { announcement: data }, 'Agency-wide announcement published', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new AnnouncementsController();
