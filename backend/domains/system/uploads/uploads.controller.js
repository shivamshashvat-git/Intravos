import uploadService from './uploads.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * UploadsController — Industrialized Generic Asset Ingestion
 */
class UploadsController {
  
  async post__0(req, res, next) {
    try {
      if (!req.file) return response.error(res, 'file field is required', 400);

      const bucketKey = req.body.bucket_key || req.query.bucket_key || req.body.bucket || req.query.bucket || 'uploads';
      
      const data = await uploadService.handleGenericUpload(req.user.tenantId, req.user.id, req.file, bucketKey);
      
      return response.success(res, data, 'Cloud asset ingested successfully', 201);
    } catch (error) {
      if (error.message.includes('Storage limit')) return response.error(res, error.message, 413);
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new UploadsController();
