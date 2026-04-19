
import cancellationService from './cancellation.service.js';
import response from '../../../core/utils/responseHandler.js';

class CancellationsController {
  async listCancellations(req, res, next) {
    try {
      const data = await cancellationService.listCancellations(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getRefundTracker(req, res, next) {
    try {
      const data = await cancellationService.getRefundTracker(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async createCancellation(req, res, next) {
    try {
      const cancellation = await cancellationService.createCancellation(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { cancellation }, 'Cancellation recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const cancellation = await cancellationService.updateStatus(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { cancellation }, 'Status updated');
    } catch (error) {
      next(error);
    }
  }

  async recordRefundReceived(req, res, next) {
    try {
      const cancellation = await cancellationService.recordRefundReceived(req.user.tenantId, req.params.id, req.body.amount);
      return response.success(res, { cancellation }, 'Refund recorded');
    } catch (error) {
      next(error);
    }
  }
}

export default new CancellationsController();
