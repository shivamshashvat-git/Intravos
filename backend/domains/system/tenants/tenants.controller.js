import tenantsService from './tenants.service.js';
import response from '../../../core/utils/responseHandler.js';
import { tenantUpdateSchema, platformSettingsSchema, bankAccountSchema } from './tenants.schema.js';

class TenantsController {
  async getTenantProfile(req, res, next) {
    try {
      const data = await tenantsService.getTenantProfile(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateTenantProfile(req, res, next) {
    try {
      const validated = tenantUpdateSchema.parse(req.body);
      const data = await tenantsService.updateTenantProfile(req.user.tenantId, validated, req.user.id);
      return response.success(res, data, 'Agency profile updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async getPlatformSettings(req, res, next) {
    try {
      const data = await tenantsService.getPlatformSettings(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updatePlatformSettings(req, res, next) {
    try {
      const validated = platformSettingsSchema.parse(req.body);
      const data = await tenantsService.updatePlatformSettings(req.user.tenantId, validated, req.user.id);
      return response.success(res, data, 'Platform settings updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async listBankAccounts(req, res, next) {
    try {
      const data = await tenantsService.listBankAccounts(req.user.tenantId);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async addBankAccount(req, res, next) {
    try {
      const validated = bankAccountSchema.parse(req.body);
      const data = await tenantsService.addBankAccount(req.user.tenantId, validated, req.user.id);
      return response.success(res, data, 'Bank account added', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async updateBankAccount(req, res, next) {
    try {
      const validated = bankAccountSchema.partial().parse(req.body);
      const data = await tenantsService.updateBankAccount(req.user.tenantId, req.params.id, validated, req.user.id);
      return response.success(res, data, 'Bank account updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async deleteBankAccount(req, res, next) {
    try {
      await tenantsService.deleteBankAccount(req.user.tenantId, req.params.id, req.user.id);
      return response.success(res, null, 'Bank account removed');
    } catch (error) {
      next(error);
    }
  }

  async setPrimaryBankAccount(req, res, next) {
    try {
      await tenantsService.setPrimaryBankAccount(req.user.tenantId, req.params.id, req.user.id);
      return response.success(res, null, 'Primary bank account set');
    } catch (error) {
      next(error);
    }
  }
}

export default new TenantsController();
