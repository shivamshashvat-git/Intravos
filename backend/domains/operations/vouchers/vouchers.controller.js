import voucherService from './voucher.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * VouchersController — Industrialized Vendor Fulfillment
 */
class VouchersController {
  
  /**
   * Provision New Fulfillment Voucher
   */
  async post_generate_0(req, res, next) {
    try {
      const voucher = await voucherService.generateVoucher(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { voucher }, 'Voucher generated successfully', 201);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  /**
   * Fetch Voucher Details
   */
  async get_id_1(req, res, next) {
    try {
      const voucher = await voucherService.getById(req.user.tenantId, req.params.id);
      if (!voucher) return response.error(res, 'Voucher not found', 404);
      return response.success(res, { voucher });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Professional PDF Voucher
   */
  async get_id_pdf_2(req, res, next) {
    try {
      const voucher = await voucherService.getById(req.user.tenantId, req.params.id);
      if (!voucher) return response.error(res, 'Voucher not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('voucher', voucher, branding);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="voucher-${voucher.booking_reference || voucher.id}.pdf"`);
      return res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seal & Dispatch to Supplier
   */
  async post_id_send_3(req, res, next) {
    try {
      const voucher = await voucherService.markSent(req.user.tenantId, req.params.id);
      return response.success(res, { voucher }, 'Voucher dispatched to supplier');
    } catch (error) {
      next(error);
    }
  }
}

export default new VouchersController();
