
import voucherService from './voucher.service.js';
import response from '../../../core/utils/responseHandler.js';

class VouchersController {
  async listVouchers(req, res, next) {
    try {
      const vouchers = await voucherService.listVouchers(req.user.tenantId, req.query);
      return response.success(res, { vouchers });
    } catch (error) {
      next(error);
    }
  }

  async createVoucher(req, res, next) {
    try {
      const voucher = await voucherService.createVoucher(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { voucher }, 'Voucher issued', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateVoucher(req, res, next) {
    try {
      const voucher = await voucherService.updateVoucher(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { voucher }, 'Voucher updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteVoucher(req, res, next) {
    try {
      await voucherService.deleteVoucher(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Voucher removed');
    } catch (error) {
      next(error);
    }
  }

  async generateVoucherPdf(req, res, next) {
    try {
      const pdf = await voucherService.generatePdf(req.user.tenantId, req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="voucher-${req.params.id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
}

export default new VouchersController();
