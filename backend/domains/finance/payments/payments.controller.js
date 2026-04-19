import paymentService from './payment.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import messageService from '../../../providers/communication/messageService.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * PaymentsController — Industrialized Ledger Management
 */
class PaymentsController {
  
  async listTransactions(req, res, next) {
    try {
      const data = await paymentService.listTransactions(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async recordCustomerPayment(req, res, next) {
    try {
      const payment = await paymentService.recordCustomerPayment(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { payment }, 'Customer payment registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async recordSupplierPayment(req, res, next) {
    try {
      const payment = await paymentService.recordSupplierPayment(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { payment }, 'Supplier payout registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const payment = await paymentService.updatePayment(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, { payment }, 'Payment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deletePayment(req, res, next) {
    try {
      await paymentService.deletePayment(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Payment record removed');
    } catch (error) {
      next(error);
    }
  }

  async getPaymentReceiptPdf(req, res, next) {
    try {
      const payment = await paymentService.getReceiptData(req.user.tenantId, req.params.id);
      if (!payment) return response.error(res, 'Payment not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('payment_receipt', payment, branding);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${payment.id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async listBankAccounts(req, res, next) {
    try {
      const data = await paymentService.listBankAccounts(req.user.tenantId);
      return response.success(res, { accounts: data });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentsController();
