import trashService from './trash.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * TrashController — Industrialized Data Recovery & Purging
 */
class TrashController {
  
  /**
   * List Managed Archived Items
   */
  async get__0(req, res, next) {
    try {
      const isAdmin = req.user.role === 'super_admin';
      const result = await trashService.listTrash(req.user.tenantId, isAdmin, req.query);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Orchestrate Resource Restoration
   */
  async post_table__id_restore_1(req, res, next) {
    try {
      const result = await trashService.restoreItem(req.user.tenantId, req.user.id, req.params.table, req.params.id);
      return response.success(res, result, 'Resource restored from archives');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Orchestrate Permanent Purge
   */
  async post_table__id_permanent_delete_2(req, res, next) {
    try {
      const result = await trashService.purgeItem(req.user.tenantId, req.user.id, req.params.table, req.params.id);
      return response.success(res, result, 'Resource permanently purged from system');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new TrashController();
