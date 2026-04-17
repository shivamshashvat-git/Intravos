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
}

export default new PublicController();
