
import miscServiceService from './misc-service.service.js';
import response from '../../../core/utils/responseHandler.js';

class MiscServicesController {
  async listServices(req, res, next) {
    try {
      const services = await miscServiceService.listServices(req.user.tenantId, req.query);
      return response.success(res, { services });
    } catch (error) {
      next(error);
    }
  }

  async createService(req, res, next) {
    try {
      const service = await miscServiceService.createService(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { service }, 'Service added', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req, res, next) {
    try {
      const service = await miscServiceService.updateService(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { service }, 'Service updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req, res, next) {
    try {
      await miscServiceService.deleteService(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Service removed');
    } catch (error) {
      next(error);
    }
  }
}

export default new MiscServicesController();
