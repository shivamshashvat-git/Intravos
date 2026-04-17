import cancellationService from './cancellation.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * CancellationsController — Industrialized Reversal & Refund Management
 */
class CancellationsController {
  
  /**
   * List Cancellations with Filters
   */
  async get__0(req, res, next) {
    try {
      const data = await cancellationService.listCancellations(req.user.tenantId, req.query);
      return response.success(res, { cancellations: data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Financial Audit: Refund Analytics
   */
  async get_refund_tracker_1(req, res, next) {
    try {
      const result = await cancellationService.getRefundTracker(req.user.tenantId);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record New Cancellation (Partial/Full)
   */
  async post__2(req, res, next) {
    try {
      const cancellation = await cancellationService.createCancellation(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { cancellation }, 'Cancellation recorded and booking synchronized', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Request State
   */
  async patch_id_status_3(req, res, next) {
    try {
      if (!req.body.service_status) return response.error(res, 'service_status is required', 400);
      const data = await cancellationService.updateStatus(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { cancellation: data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ledger Sync: Mark Refund Received from Supplier
   */
  async patch_id_refund_received_4(req, res, next) {
    try {
      const { refund_received_vendor, service_status } = req.body;
      const data = await cancellationService.recordRefundReceived(req.user.tenantId, req.params.id, refund_received_vendor, service_status);
      return response.success(res, { cancellation: data }, 'Refund receipt synchronized across ledgers');
    } catch (error) {
      next(error);
    }
  }
}

export default new CancellationsController();
