import supplierService from './supplier.service.js';
import response from '../../../core/utils/responseHandler.js';

/**
 * SuppliersController — Industrialized Vendor Governance
 */
class SuppliersController {
  
  async get__0(req, res, next) {
    try {
      const data = await supplierService.list(req.user.tenantId);
      return response.success(res, { suppliers: data });
    } catch (error) {
      next(error);
    }
  }

  async get_id_1(req, res, next) {
    try {
      const result = await supplierService.getSupplierProfile(req.user.tenantId, req.params.id);
      if (!result) return response.error(res, 'Supplier not found', 404);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async post__2(req, res, next) {
    try {
      const data = await supplierService.create(req.user.tenantId, {
        ...req.body,
        created_by: req.user.id
      });
      return response.success(res, { supplier: data }, 'Supplier registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async put_id_3(req, res, next) {
    try {
      const data = await supplierService.update(req.user.tenantId, req.params.id, req.body);
      if (!data) return response.error(res, 'Supplier not found', 404);
      return response.success(res, { supplier: data }, 'Supplier profile updated');
    } catch (error) {
      next(error);
    }
  }

  async delete_id_3(req, res, next) {
    try {
      const result = await supplierService.delete(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Supplier not found', 404);
      return response.success(res, result, 'Supplier de-listed');
    } catch (error) {
      next(error);
    }
  }
}

export default new SuppliersController();
