import publicService from './public.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * PublicController — Industrialized External Integrations
 */
class PublicController {
  
  async post_leads(req, res, next) {
    try {
      const lead = await publicService.ingestLead(req.tenantId, req.body);
      return response.success(res, { lead_id: lead.id }, 'Lead received and queued for processing', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  async get_offers(req, res, next) {
    try {
      const data = await publicService.listPublishedOffers(req.tenantId);
      return response.success(res, { offers: data });
    } catch (error) {
      next(error);
    }
  }

  async get_trip(req, res, next) {
    try {
      const data = await publicService.getTripSitePayload(req.params.token);
      if (!data) return response.error(res, 'Trip not found or no longer available', 404);
      return response.success(res, data);
    } catch (error) { next(error); }
  }

  async post_trip_approve(req, res, next) {
    try {
       await publicService.approveTrip(req.params.token);
       return response.success(res, { success: true }, 'Trip proposal approved');
    } catch (error) { next(error); }
  }

  async post_trip_changes(req, res, next) {
    try {
       await publicService.requestTripChanges(req.params.token, req.body);
       return response.success(res, { success: true }, 'Change request submitted');
    } catch (error) { next(error); }
  }

  async post_webhook_payments(req, res, next) {
     try {
        await publicService.handlePaymentWebhook(req.body);
        return res.status(200).send('OK');
     } catch (e) { next(e); }
  }
}

export default new PublicController();
