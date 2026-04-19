import customerService from './customer.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * CustomersController — Industrialized CRM Management
 */
class CustomersController {
  
  /**
   * List customers with pagination & search
   */
  async listCustomers(req, res, next) {
    try {
      const { search, customer_type, tags, page = 1, limit = 50 } = req.query;
      const result = await customerService.getCustomers(req.user.tenantId, { search, customer_type, tags, page, limit });
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch single customer full profile
   */
  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.user.tenantId, req.params.id);
      if (!customer) return response.error(res, 'Customer not found', 404);
      
      // Calculate health on the fly for detail view
      const health = await customerService.calculateCustomerHealth(req.user.tenantId, req.params.id);
      
      return response.success(res, { customer, health });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new customer record
   */
  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.user.tenantId, {
        ...req.body,
        created_by: req.user.id
      });
      return response.success(res, { customer }, 'Customer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update active customer details
   */
  async updateCustomer(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.user.tenantId, req.params.id, req.body);
      if (!customer) return response.error(res, 'Customer not found', 404);
      return response.success(res, { customer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft-delete/Archive customer
   */
  async deleteCustomer(req, res, next) {
    try {
      const result = await customerService.deleteCustomer(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, result, 'Customer record archived');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch associated travelers
   */
  async getTravelers(req, res, next) {
    try {
      const travelers = await customerService.getTravelers(req.user.tenantId, req.params.id);
      return response.success(res, travelers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a traveler to a customer profile
   */
  async addTraveler(req, res, next) {
    try {
      const traveler = await customerService.addTraveler(req.user.tenantId, req.params.id, {
        ...req.body,
        created_by: req.user.id
      });
      return response.success(res, traveler, 'Traveler added', 201);
    } catch (error) {
      next(error);
    }
  }

  // ── ANALYTICS & DEDUP ──

  async getDuplicatePhones(req, res, next) {
    try {
      const duplicates = await customerService.getDuplicatePhones(req.user.tenantId);
      return response.success(res, duplicates);
    } catch (error) {
      next(error);
    }
  }

  // ── ENGAGEMENT ENGINE ──

  async getUpcomingBirthdays(req, res, next) {
    try {
      const birthdays = await customerService.getUpcomingBirthdays(req.user.tenantId);
      return response.success(res, birthdays);
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingAnniversaries(req, res, next) {
    try {
      const anniversaries = await customerService.getUpcomingAnniversaries(req.user.tenantId);
      return response.success(res, anniversaries);
    } catch (error) {
      next(error);
    }
  }

  async getDormantCustomers(req, res, next) {
    try {
      const dormant = await customerService.getDormantCustomers(req.user.tenantId);
      return response.success(res, dormant);
    } catch (error) {
      next(error);
    }
  }

  // ── MESSAGE TEMPLATES ──

  async listMessageTemplates(req, res, next) {
    try {
      const templates = await customerService.getMessageTemplates(req.user.tenantId);
      return response.success(res, templates);
    } catch (error) {
      next(error);
    }
  }

  async createMessageTemplate(req, res, next) {
    try {
      const template = await customerService.createMessageTemplate(req.user.tenantId, req.body);
      return response.success(res, template, 'Template created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMessageTemplate(req, res, next) {
    try {
      const template = await customerService.updateMessageTemplate(req.user.tenantId, req.params.id, req.body);
      return response.success(res, template);
    } catch (error) {
      next(error);
    }
  }

  async deleteMessageTemplate(req, res, next) {
    try {
      await customerService.deleteMessageTemplate(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Template deleted');
    } catch (error) {
      next(error);
    }
  }

  // ── FEEDBACK & REFERRALS ──

  async requestFeedback(req, res, next) {
    try {
      const result = await customerService.initiateFeedbackRequest(req.user.tenantId, req.user.id, req.body);
      return response.success(res, result, 'Feedback link generated');
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackByToken(req, res, next) {
    try {
      const feedback = await customerService.getFeedbackByToken(req.params.token);
      return response.success(res, feedback);
    } catch (error) {
      next(error);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const result = await customerService.submitFeedback(req.params.token, req.body);
      return response.success(res, result, 'Feedback submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async listReferrals(req, res, next) {
    try {
      const referrals = await customerService.getReferrals(req.user.tenantId);
      return response.success(res, referrals);
    } catch (error) {
      next(error);
    }
  }

  async createReferral(req, res, next) {
    try {
      const referral = await customerService.createReferral(req.user.tenantId, req.body);
      return response.success(res, referral, 'Referral logged', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateReferral(req, res, next) {
    try {
      const referral = await customerService.updateReferral(req.user.tenantId, req.params.id, req.body);
      return response.success(res, referral);
    } catch (error) {
      next(error);
    }
  }

  // ── RELATIONS ──

  async getCustomerBookings(req, res, next) {
    try {
      const data = await customerService.getCustomerBookings(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerQuotations(req, res, next) {
    try {
      const data = await customerService.getCustomerQuotations(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerInvoices(req, res, next) {
    try {
      const data = await customerService.getCustomerInvoices(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomersController();
