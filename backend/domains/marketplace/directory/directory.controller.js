import directoryService from './directory.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * DirectoryController — Industrialized Partner & Vendor Governance
 */
class DirectoryController {
  
  /**
   * Monitor Upcoming Payment Obligations
   */
  async get_payment_calendar_0(req, res, next) {
    try {
      const data = await directoryService.getPaymentCalendar(req.user.tenantId, req.query.days);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Managed Partners & Contacts
   */
  async get__1(req, res, next) {
    try {
      const data = await directoryService.listContacts(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Exhaustive Contact Profile
   */
  async get_id_2(req, res, next) {
    try {
      const data = await directoryService.getContact(req.user.tenantId, req.params.id);
      return response.success(res, { contact: data });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Register New Operational Contact
   */
  async post__3(req, res, next) {
    try {
      const data = await directoryService.createContact(req.user.tenantId, req.body);
      return response.success(res, { contact: data }, 'Contact registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modify Contact Attributes
   */
  async patch_id_4(req, res, next) {
    try {
      const data = await directoryService.updateContact(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { contact: data }, 'Contact profile updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Securely Attach Rate Card Documentation
   */
  async post_id_rate_cards_5(req, res, next) {
    try {
      const data = await directoryService.addRateCard(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, { rate_card: data }, 'Rate card documentation attached', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  /**
   * Retire Rate Card Entry
   */
  async delete_id_rate_cards__cardId_6(req, res, next) {
    try {
      const result = await directoryService.deleteRateCard(req.user.tenantId, req.user.id, req.params.id, req.params.cardId);
      if (!result) return response.error(res, 'Rate card not found', 404);
      return response.success(res, result, 'Rate card document retired');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire Directory Contact
   */
  async delete_id_7(req, res, next) {
    try {
      const result = await directoryService.deleteContact(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Contact not found', 404);
      return response.success(res, result, 'Contact retired from directory');
    } catch (error) {
      next(error);
    }
  }
}

export default new DirectoryController();
