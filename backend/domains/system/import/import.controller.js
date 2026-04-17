import importService from './import.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * ImportController — Industrialized Multi-Standard Data Intake
 */
class ImportController {
  
  /**
   * Orchestrate Initial File Registry
   */
  async post_upload_0(req, res, next) {
    try {
      const data = await importService.uploadFile(req.user.tenantId, req.user.id, req.file, req.body.import_type);
      return response.success(res, data, 'File uploaded and parsed successfully', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  /**
   * Preview Mapping & Integrity Check
   */
  async post_preview_1(req, res, next) {
    try {
      const data = await importService.previewMapping(req.user.tenantId, req.body);
      return response.success(res, data, 'Mapping preview generated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute Standardized Batch Ingestion
   */
  async post_execute_2(req, res, next) {
    try {
      const data = await importService.executeImport(req.user.tenantId, req.body);
      return response.success(res, { import_log: data }, 'Data intake completed successfully');
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Fetch Intake History
   */
  async get_logs_3(req, res, next) {
    try {
      const data = await importService.getLogs(req.user.tenantId);
      return response.success(res, { import_logs: data });
    } catch (error) {
      next(error);
    }
  }
}

export default new ImportController();
