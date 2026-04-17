import invoiceService from './invoice.service.js';
import financialService from '../shared/financialService.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * InvoicesController — Industrialized Financial Management
 */
class InvoicesController {
  
  async get__0(req, res, next) {
    try {
      const data = await invoiceService.listInvoices(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get_gst_summary_1(req, res, next) {
    try {
      const { financial_year } = req.query;
      const summary = await invoiceService.getGstSummary(req.user.tenantId, financial_year);
      return response.success(res, { 
        financial_year: financial_year || financialService.getCurrentFinancialYear(),
        summary 
      });
    } catch (error) {
      next(error);
    }
  }

  async get_share__token_9(req, res, next) {
    try {
      const result = await invoiceService.getPublicInvoiceShare(req.params.token);
      if (!result) return response.error(res, 'Invoice not found', 404);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get_id_2(req, res, next) {
    try {
      const invoice = await invoiceService.getById(req.user.tenantId, req.params.id);
      if (!invoice) return response.error(res, 'Invoice not found', 404);
      return response.success(res, { invoice });
    } catch (error) {
      next(error);
    }
  }

  async post__5(req, res, next) {
    try {
      const invoice = await invoiceService.createInvoice(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { invoice }, 'Invoice created', 201);
    } catch (error) {
      next(error);
    }
  }

  async get_id_pdf_4(req, res, next) {
    try {
      const invoice = await invoiceService.getById(req.user.tenantId, req.params.id);
      if (!invoice) return response.error(res, 'Invoice not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('invoice', { ...invoice, bank_text: branding.invoice_bank_text || '' }, branding);

      const clientName = (invoice.customer_name || '').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').substring(0, 50);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.invoice_number || invoice.id}-${clientName}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async patch_id(req, res, next) {
    try {
      const invoice = await invoiceService.updateInvoice(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { invoice }, 'Invoice updated');
    } catch (error) {
      next(error);
    }
  }

  async delete_id(req, res, next) {
    try {
      await invoiceService.deleteInvoice(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Invoice removed from records');
    } catch (error) {
      next(error);
    }
  }

  async get_gstr1_export(req, res, next) {
    try {
      const data = await invoiceService.getGstr1Data(req.user.tenantId, req.query);

      // Industrialized CSV Builder
      const header = 'GSTIN,Receiver,Invoice No,Date,Total,Taxable,CGST,SGST,IGST';
      const rows = data.map(i => [
        i.customer_gstin || '',
        `"${i.customer_name}"`,
        i.invoice_number,
        new Date(i.created_at).toLocaleDateString('en-GB'),
        i.total,
        i.subtotal,
        i.cgst,
        i.sgst,
        i.igst
      ].join(','));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="GSTR1-${req.query.financial_year || 'export'}.csv"`);
      res.status(200).send([header, ...rows].join('\n'));
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoicesController();
