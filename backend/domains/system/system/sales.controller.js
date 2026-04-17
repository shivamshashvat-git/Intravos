import salesService from './sales.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * SalesController — Industrialized Funnel Orchestration
 */
class SalesController {
  
  async post_inquire(req, res, next) {
    try {
      const data = await salesService.submitInquiry(req.body);
      return response.success(res, { inquiry: data }, 'Inquiry received and queued for processing', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async get_inquiries(req, res, next) {
    try {
      const data = await salesService.listInquiries(req.user.userRole);
      return response.success(res, { inquiries: data });
    } catch (error) {
      if (error.message.includes('Super Admin')) return response.error(res, error.message, 403);
      next(error);
    }
  }

  async patch_inquiry_status(req, res, next) {
    try {
      const data = await salesService.updateInquiryStatus(req.user.userRole, req.params.id, req.body.status);
      return response.success(res, { inquiry: data }, 'Funnel status synchronized');
    } catch (error) {
      if (error.message.includes('Super Admin')) return response.error(res, error.message, 403);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new SalesController();
