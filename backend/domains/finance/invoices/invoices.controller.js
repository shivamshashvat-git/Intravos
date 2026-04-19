import { invoiceSchema, updateInvoiceSchema } from './invoices.schema.js';
import invoiceService from './invoice.service.js';
import financialService from '../shared/financialService.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * InvoicesController — Industrialized Financial Management
 */
class InvoicesController {
  
  /**
   * List all invoices for the tenant
   */
  async listInvoices(req, res, next) {
    try {
      const data = await invoiceService.listInvoices(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch single invoice with items
   */
  async getInvoiceById(req, res, next) {
    try {
      const invoice = await invoiceService.getById(req.user.tenantId, req.params.id);
      if (!invoice) return response.error(res, 'Invoice not found', 404);
      return response.success(res, { invoice });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate a manual tax invoice
   */
  async createInvoice(req, res, next) {
    try {
      const validated = invoiceSchema.parse(req.body);
      const invoice = await invoiceService.createInvoice(req.user.tenantId, req.user.id, validated);
      return response.success(res, { invoice }, 'Invoice created', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  /**
   * Update invoice metadata or items
   */
  async updateInvoice(req, res, next) {
    try {
      const validated = updateInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.updateInvoice(req.user.tenantId, req.user.id, req.params.id, validated);
      return response.success(res, { invoice }, 'Invoice updated successfully');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  /**
   * Soft-delete invoice
   */
  async deleteInvoice(req, res, next) {
    try {
      await invoiceService.deleteInvoice(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Invoice archived successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate invoice totals (Payments + Items)
   */
  async recalculateInvoice(req, res, next) {
    try {
      const invoice = await invoiceService.recalculate(req.user.tenantId, req.params.id);
      return response.success(res, { invoice }, 'Invoice totals recalculated');
    } catch (error) {
      next(error);
    }
  }


  /**
   * Generate Invoice PDF
   */
  async getInvoicePdf(req, res, next) {
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

  /**
   * Fetch aggregate GST liability data
   */
  async getGstSummary(req, res, next) {
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

  /**
   * Accountant CSV Export (GSTR-1)
   */
  async getGstr1Export(req, res, next) {
    try {
      const data = await invoiceService.getGstr1Data(req.user.tenantId, req.query);
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
      res.setHeader('Content-Disposition', `attachment; filename="GSTR1-Export.csv"`);
      res.status(200).send([header, ...rows].join('\n'));
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoicesController();
