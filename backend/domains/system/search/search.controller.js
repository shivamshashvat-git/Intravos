import searchService from './search.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * SearchController — Industrialized Global Discovery
 */
class SearchController {
  
  async get__0(req, res, next) {
    try {
      const data = await searchService.globalSearch(req.user.tenantId, req.query.q, req.query.limit);
      return response.success(res, data);
    } catch (error) {
      if (error.message.includes('at least 2 characters')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new SearchController();
