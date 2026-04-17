import referralService from './referral.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * ReferralsController — Industrialized Growth & Partnership Coordination
 */
class ReferralsController {
  
  /**
   * Fetch Partner Ecosystem State
   */
  async get_me(req, res, next) {
    try {
      const data = await referralService.getReferralState(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Payout Coordinates
   */
  async patch_bank_details(req, res, next) {
    try {
      const data = await referralService.updatePayoutDetails(req.user.tenantId, req.body.payout_bank_details);
      return response.success(res, { payout_bank_details: data }, 'Payout details updated successfully');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new ReferralsController();
