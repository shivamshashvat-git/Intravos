import customerService from './customer.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * CustomersController — Industrialized CRM Management
 */
class CustomersController {
  
  async post_id_privacy_revoke(req, res, next) {
    try {
      const customer = await customerService.anonymizeCustomer(req.user.tenantId, req.params.id);
      return response.success(res, { customer }, 'Privacy revocation complete. PII has been scrambled.');
    } catch (error) {
      next(error);
    }
  }

  async get__3(req, res, next) {
    try {
      const { search, page = 1, limit = 50 } = req.query;
      const result = await customerService.getCustomers(req.user.tenantId, { search, page, limit });
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get_id_4(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.user.tenantId, req.params.id);
      if (!customer) return response.error(res, 'Customer not found', 404);
      return response.success(res, { customer });
    } catch (error) {
      next(error);
    }
  }

  async post__5(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.user.tenantId, req.body);
      return response.success(res, { customer }, 'Customer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_6(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.user.tenantId, req.params.id, req.body);
      if (!customer) return response.error(res, 'Customer not found', 404);
      return response.success(res, { customer });
    } catch (error) {
      next(error);
    }
  }

  async get_id_timeline_10(req, res, next) {
    try {
      const timeline = await customerService.getCustomerTimeline(req.user.tenantId, req.params.id);
      return response.success(res, { timeline });
    } catch (error) {
      next(error);
    }
  }

  async get_id_bookings_11(req, res, next) {
    try {
      const bookings = await customerService.getCustomerBookings(req.user.tenantId, req.params.id);
      return response.success(res, { bookings });
    } catch (error) {
      next(error);
    }
  }

  async get_id_quotations_12(req, res, next) {
    try {
      const quotations = await customerService.getCustomerQuotations(req.user.tenantId, req.params.id);
      return response.success(res, { quotations });
    } catch (error) {
      next(error);
    }
  }

  async get_id_invoices_13(req, res, next) {
    try {
      const invoices = await customerService.getCustomerInvoices(req.user.tenantId, req.params.id);
      return response.success(res, { invoices });
    } catch (error) {
      next(error);
    }
  }

  async get_id_visas_14(req, res, next) {
    try {
      const visas = await customerService.getCustomerVisas(req.user.tenantId, req.params.id);
      return response.success(res, { visas });
    } catch (error) {
      next(error);
    }
  }

  async get_id_documents_15(req, res, next) {
    try {
      const documents = await customerService.getCustomerDocuments(req.user.tenantId, req.params.id);
      return response.success(res, { documents });
    } catch (error) {
      next(error);
    }
  }

  async delete_id_9(req, res, next) {
    try {
      const result = await customerService.deleteCustomer(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Customer not found', 404);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomersController();
