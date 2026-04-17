import groupBookingService from './group-booking.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * GroupBookingsController — Industrialized Collaborative Booking Management
 */
class GroupBookingsController {
  
  /**
   * List Group Members
   */
  async get_bookingId_members_0(req, res, next) {
    try {
      const members = await groupBookingService.getMembers(req.user.tenantId, req.params.bookingId);
      return response.success(res, { members });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add Individual Member to Group
   */
  async post_bookingId_members_1(req, res, next) {
    try {
      if (!req.body.member_name) return response.error(res, 'member_name is required', 400);
      const member = await groupBookingService.addMember(req.user.tenantId, req.user.id, req.params.bookingId, req.body);
      return response.success(res, { member }, 'Member added to group', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate Group Totals (Sync)
   */
  async post_bookingId_calculate_2(req, res, next) {
    try {
      const result = await groupBookingService.recalculateGroup(req.user.tenantId, req.params.bookingId);
      return response.success(res, result, 'Group financials synchronized');
    } catch (error) {
      next(error);
    }
  }

  async post_bookingId_generate_invoices_3(req, res, next) {
    try {
      const result = await groupBookingService.bulkGenerateInvoices(req.user.tenantId, req.user.id, req.params.bookingId);
      return response.success(res, result, 'Member invoices generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Member Details & Financials
   */
  async put_id_member(req, res, next) {
    try {
      const member = await groupBookingService.updateMember(req.user.tenantId, req.params.bookingId, req.params.id, req.body);
      return response.success(res, { member }, 'Member updated');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new GroupBookingsController();
