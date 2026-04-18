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
      const { search, page = 1, limit = 50 } = req.query;
      const result = await customerService.getCustomers(req.user.tenantId, { search, page, limit });
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
      return response.success(res, { customer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new customer record
   */
  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.user.tenantId, req.body);
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
   * Preview a merge between two customers
   */
  async getMergePreview(req, res, next) {
    try {
      const { keep_id, merge_id } = req.body;
      const preview = await customerService.getMergePreview(req.user.tenantId, keep_id, merge_id);
      return response.success(res, preview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute permanent customer merge
   */
  async mergeCustomers(req, res, next) {
    try {
      const { keep_id, merge_id, reason } = req.body;
      const result = await customerService.performMerge(req.user.tenantId, req.user.id, keep_id, merge_id, reason);
      return response.success(res, result, 'Customers merged successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * List history of customer merges
   */
  async getMergeLogs(req, res, next) {
    try {
      const logs = await customerService.getMergeLogs(req.user.tenantId);
      return response.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Privacy / GDPR Revocation (Anonymization)
   */
  async revokePrivacyConsent(req, res, next) {
    try {
      const customer = await customerService.anonymizeCustomer(req.user.tenantId, req.params.id);
      return response.success(res, { customer }, 'Privacy revocation complete. PII has been scrambled.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch associated travelers (family/colleagues)
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
      const traveler = await customerService.addTraveler(req.user.tenantId, req.params.id, req.body);
      return response.success(res, traveler, 'Traveler added', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch unified activity timeline
   */
  async getCustomerTimeline(req, res, next) {
    try {
      const timeline = await customerService.getCustomerTimeline(req.user.tenantId, req.params.id);
      return response.success(res, { timeline });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch cross-module relations
   */
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

  async getCustomerVisas(req, res, next) {
    try {
      const data = await customerService.getCustomerVisas(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getCustomerDocuments(req, res, next) {
    try {
      const data = await customerService.getCustomerDocuments(req.user.tenantId, req.params.id);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomersController();
