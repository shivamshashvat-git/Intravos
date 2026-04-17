import masterAssetService from './master_asset.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * MasterAssetsController — Industrialized Knowledge Bank Orchestration
 */
class MasterAssetsController {
  
  /**
   * List specialized assets with global/tenant switching
   */
  async get__0(req, res, next) {
    try {
      const data = await masterAssetService.listAssets(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Exhaustive Asset Entity
   */
  async get_id_1(req, res, next) {
    try {
      const asset = await masterAssetService.getAsset(req.user.tenantId, req.params.id);
      if (!asset) return response.error(res, 'Asset not found', 404);
      return response.success(res, { asset });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Asset Registry
   */
  async post__2(req, res, next) {
    try {
      if (!req.body.asset_type || !req.body.title) {
        return response.error(res, 'asset_type and title are required', 400);
      }
      const asset = await masterAssetService.createAsset(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { asset }, 'Asset registered', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enshrine Entity as Template
   */
  async post_import_3(req, res, next) {
    try {
      const asset = await masterAssetService.importToLibrary(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { asset }, 'Entity enshrined in Knowledge Bank', 201);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Instantiate Template into Live Operation
   */
  async post_id_pull_4(req, res, next) {
    try {
      const result = await masterAssetService.instantiateAsset(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, result, 'Template instantiated successfully', 201);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }

  /**
   * Modify Asset Attributes
   */
  async patch_id_5(req, res, next) {
    try {
      const asset = await masterAssetService.updateAsset(req.user.tenantId, req.params.id, req.body);
      if (!asset) return response.error(res, 'Asset not found', 404);
      return response.success(res, { asset }, 'Asset updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retire Asset entity
   */
  async delete_id_6(req, res, next) {
    try {
      const result = await masterAssetService.deleteAsset(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Asset not found', 404);
      return response.success(res, result, 'Asset retired');
    } catch (error) {
      next(error);
    }
  }
}

export default new MasterAssetsController();
