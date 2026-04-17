import visaService from './visa.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * VisaController — Industrialized Travel Document Compliance
 */
class VisaController {
  
  /**
   * List Tracking Records
   */
  async get__0(req, res, next) {
    try {
      const data = await visaService.listRecords(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Exhaustive Compliance Data
   */
  async get_id_1(req, res, next) {
    try {
      const data = await visaService.getRecord(req.user.tenantId, req.params.id);
      return response.success(res, { visa: data });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Orchestrate New Application Entry
   */
  async post__2(req, res, next) {
    try {
      const data = await visaService.createRecord(req.user.tenantId, req.body);
      return response.success(res, { visa: data }, 'Visa record created', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Transition Tracking State
   */
  async patch_id_3(req, res, next) {
    try {
      const data = await visaService.updateRecord(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { visa: data }, 'Visa record updated');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Retire Compliance Entry
   */
  async delete_id_4(req, res, next) {
    try {
      const result = await visaService.deleteRecord(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Visa record not found', 404);
      return response.success(res, result, 'Visa record retired');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Securely Attach Compliance Document
   */
  async post_id_documents_5(req, res, next) {
    try {
      const data = await visaService.addDocument(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { document: data }, 'Document attached', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Update Document Registry
   */
  async patch_id_documents__docId_6(req, res, next) {
    try {
      const data = await visaService.updateDocument(req.user.tenantId, req.params.id, req.params.docId, req.body);
      return response.success(res, { document: data }, 'Document registry updated');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new VisaController();
