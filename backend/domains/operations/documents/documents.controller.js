import documentService from './document.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * DocumentsController — Industrialized Asset Delivery
 */
class DocumentsController {
  
  async get_public__token_0(req, res, next) {
    try {
      const result = await documentService.getPublicDocument(req.params.token);
      return response.success(res, { document: result });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      if (error.message.includes('expired')) return response.error(res, error.message, 410);
      next(error);
    }
  }

  async get_travel_pack_prefetch_1(req, res, next) {
    try {
      const data = await documentService.getTravelPack(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get__2(req, res, next) {
    try {
      const data = await documentService.listDocuments(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async post_upload_3(req, res, next) {
    try {
      if (!req.file) return response.error(res, 'file field is required', 400);
      const data = await documentService.uploadDocument(req.user.tenantId, req.user.id, req.file, req.body);
      return response.success(res, { document: data }, 'Document uploaded successfully', 201);
    } catch (error) {
      if (error.message.includes('Only PDF')) return response.error(res, error.message, 400);
      if (error.message.includes('quota reached')) return response.error(res, error.message, 403);
      next(error);
    }
  }

  async get_id_secure_link_4(req, res, next) {
    try {
      const result = await documentService.generateSecureLink(req.user.tenantId, req.params.id);
      return response.success(res, result, 'Secure delivery link generated');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async delete_id_5(req, res, next) {
    try {
      const result = await documentService.deleteDocument(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, result, 'Document purged successfully');
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }
}

export default new DocumentsController();
