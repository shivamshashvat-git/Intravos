import visaService from './visa.service.js';
import response from '../../../core/utils/responseHandler.js';
import { visaTrackingSchema, updateVisaTrackingSchema, visaDocumentSchema, verifyDocumentSchema } from './visa.schema.js';

class VisaController {
  
  async get__0(req, res, next) {
    try {
      const data = await visaService.listRecords(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get_id_1(req, res, next) {
    try {
      const visa = await visaService.getRecord(req.user.tenantId, req.params.id);
      const documents = await visaService.listDocuments(req.user.tenantId, req.params.id);
      return response.success(res, { visa: { ...visa, documents } });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async post__2(req, res, next) {
    try {
      const validated = visaTrackingSchema.parse(req.body);
      const data = await visaService.createRecord(req.user.tenantId, req.user.id, validated);
      return response.success(res, { visa: data }, 'Visa record created', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message || 'Validation Error', 400);
      next(error);
    }
  }

  async patch_id_3(req, res, next) {
    try {
      const validated = updateVisaTrackingSchema.parse(req.body);
      const data = await visaService.updateRecord(req.user.tenantId, req.params.id, validated);
      return response.success(res, { visa: data }, 'Visa record updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message || 'Validation Error', 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async delete_id_4(req, res, next) {
    try {
      const result = await visaService.deleteRecord(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Visa record not found', 404);
      return response.success(res, result, 'Visa record retired');
    } catch (error) {
      next(error);
    }
  }

  // --- Document Methods ---

  async post_id_documents_5(req, res, next) {
    try {
      const validated = visaDocumentSchema.parse(req.body);
      const data = await visaService.createDocument(req.user.tenantId, req.params.id, req.user.id, validated);
      return response.success(res, { document: data }, 'Document attached', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message || 'Validation Error', 400);
      next(error);
    }
  }

  async patch_id_documents__docId_6(req, res, next) {
    try {
      const validated = verifyDocumentSchema.parse(req.body);
      const data = await visaService.verifyDocument(req.user.tenantId, req.params.docId, req.user.id, validated.verified);
      return response.success(res, { document: data }, 'Document verification updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message || 'Validation Error', 400);
      next(error);
    }
  }

  async delete_id_documents_docId(req, res, next) {
    try {
      await visaService.deleteDocument(req.user.tenantId, req.params.docId);
      return response.success(res, null, 'Document removed');
    } catch (error) {
      next(error);
    }
  }

  // --- Analytics & Alerts ---

  async getAnalytics(req, res, next) {
    try {
      const data = await visaService.getAnalytics(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getAlerts(req, res, next) {
    try {
      const data = await visaService.getAlerts(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async triggerStaleCheck(req, res, next) {
    try {
      const count = await visaService.checkStaleVisas();
      return response.success(res, { processed_count: count }, 'Stale visa check complete');
    } catch (error) {
      next(error);
    }
  }
}

export default new VisaController();
