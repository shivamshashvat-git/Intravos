import markupService from './markup.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * MarkupPresetsController — Industrialized Pricing Governance
 */
class MarkupPresetsController {
  
  /**
   * List Managed Pricing Rules
   */
  async listPresets(req, res, next) {
    try {
      const data = await markupService.listPresets(req.user.tenantId);
      return response.success(res, { presets: data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register New Pricing Logic
   */
  async createPreset(req, res, next) {
    try {
      const preset = await markupService.createPreset(req.user.tenantId, req.body);
      return response.success(res, { preset }, 'Markup preset created', 201);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  /**
   * Modify Internal Pricing Attributes
   */
  async updatePreset(req, res, next) {
    try {
      const preset = await markupService.updatePreset(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { preset }, 'Markup preset updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire Pricing Logic Entry
   */
  async deletePreset(req, res, next) {
    try {
      const result = await markupService.deletePreset(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Markup preset not found', 404);
      return response.success(res, result, 'Markup preset retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new MarkupPresetsController();
