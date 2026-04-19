
import groupBookingService from './group-booking.service.js';
import response from '../../../core/utils/responseHandler.js';

class GroupBookingsController {
  async getBookingMembers(req, res, next) {
    try {
      const members = await groupBookingService.getBookingMembers(req.user.tenantId, req.params.id);
      return response.success(res, { members });
    } catch (error) {
      next(error);
    }
  }

  async addBookingMember(req, res, next) {
    try {
      const member = await groupBookingService.addMember(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { member }, 'Member added to group', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMember(req, res, next) {
    try {
      const member = await groupBookingService.updateMember(req.user.tenantId, req.params.memberId, req.body);
      return response.success(res, { member }, 'Member details updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteMember(req, res, next) {
    try {
      await groupBookingService.deleteMember(req.user.tenantId, req.params.memberId);
      return response.success(res, null, 'Member removed from group');
    } catch (error) {
      next(error);
    }
  }
}

export default new GroupBookingsController();
