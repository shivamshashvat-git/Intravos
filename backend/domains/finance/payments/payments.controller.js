import paymentService from './payment.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import messageService from '../../../providers/communication/messageService.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * PaymentsController — Industrialized Ledger Management
 */
class PaymentsController {
  
  async get__0(req, res, next) {
    try {
      const data = await paymentService.listTransactions(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async post_record_1(req, res, next) {
    try {
      const payment = await paymentService.recordCustomerPayment(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { payment }, 'Customer payment registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async post_supplier_2(req, res, next) {
    try {
      const payment = await paymentService.recordSupplierPayment(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { payment }, 'Supplier payout registered', 201);
    } catch (error) {
      next(error);
    }
  }

  async get_reminder_url_5(req, res, next) {
    try {
      const { lead_id, amount } = req.query;
      if (!lead_id) return response.error(res, 'lead_id required', 400);

      const reminder = await paymentService.getReminderData(req.user.tenantId, lead_id, amount);
      
      const msg = await messageService.renderFromDb(req.user.tenantId, 'payment_reminder', reminder);

      const url = reminder.customer_phone ? messageService.getWhatsAppLink(reminder.customer_phone, msg) : null;
      return response.success(res, { url });
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async get_id_receipt_9(req, res, next) {
    try {
      const payment = await paymentService.getReceiptData(req.user.tenantId, req.params.id);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('payment_receipt', payment, branding);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="receipt-${payment.id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, 404);
      next(error);
    }
  }

  async get_accounts_6(req, res, next) {
    try {
      const data = await paymentService.listBankAccounts(req.user.tenantId);
      return response.success(res, { accounts: data });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentsController();
