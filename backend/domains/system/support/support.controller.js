import supportService from './support.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * SupportController — Industrialized Support Desk Operations
 */
class SupportController {
  
  async get_tickets_0(req, res, next) {
    try {
      const data = await supportService.listTickets(req.user.tenantId);
      return response.success(res, { tickets: data });
    } catch (error) {
      next(error);
    }
  }

  async get_tickets__id_1(req, res, next) {
    try {
      const data = await supportService.getTicket(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post_tickets_2(req, res, next) {
    try {
      const data = await supportService.createTicket(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { ticket: data }, 'Ticket registered successfully', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async post_tickets__id_reply_3(req, res, next) {
    try {
      const data = await supportService.addReply(req.user.tenantId, req.user.id, req.user.role, req.params.id, req.body.message);
      return response.success(res, { reply: data }, 'Reply appended to thread', 201);
    } catch (error) {
      if (error.message.includes('message is required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async patch_tickets__id_resolve_4(req, res, next) {
    try {
      const data = await supportService.resolveTicket(req.user.tenantId, req.user.id, req.params.id, req.body.resolution);
      return response.success(res, { ticket: data }, 'Ticket marked as resolved');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async delete_tickets__id_5(req, res, next) {
    try {
      const result = await supportService.deleteTicket(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Ticket not found', 404);
      return response.success(res, result, 'Ticket records retired');
    } catch (error) {
      next(error);
    }
  }

  async get_feature_requests_6(req, res, next) {
    try {
      const data = await supportService.listTickets(req.user.tenantId, 'feature_request');
      return response.success(res, { requests: data });
    } catch (error) {
      next(error);
    }
  }
}

export default new SupportController();
