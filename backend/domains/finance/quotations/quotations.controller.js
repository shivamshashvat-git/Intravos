import quotationService from './quotation.service.js';
import { quotationSchema, updateQuotationSchema } from './quotations.schema.js';
import response from '../../../core/utils/responseHandler.js';
import messageService from '../../../providers/communication/messageService.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * QuotationsController — Industrialized Proposal Management
 */
class QuotationsController {
  
  async listQuotations(req, res, next) {
    try {
      const data = await quotationService.listQuotations(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getQuotationById(req, res, next) {
    try {
      const data = await quotationService.getById(req.user.tenantId, req.params.id);
      if (!data) return response.error(res, 'Quotation not found', 404);
      return response.success(res, { quotation: data });
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req, res, next) {
    try {
      const validated = quotationSchema.parse(req.body);
      const data = await quotationService.createQuotation(req.user.tenantId, req.user.id, validated);
      return response.success(res, data, 'Quotation created', 201);
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async updateQuotation(req, res, next) {
    try {
      const validated = updateQuotationSchema.parse(req.body);
      const data = await quotationService.updateQuotation(req.user.tenantId, req.user.id, req.params.id, validated);
      return response.success(res, data, 'Quotation updated');
    } catch (error) {
      if (error.name === 'ZodError') return response.error(res, error.errors[0]?.message, 400);
      next(error);
    }
  }

  async reviseQuotation(req, res, next) {
    try {
      const revision = await quotationService.reviseQuotation(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { quotation: revision }, 'New revision created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async convertToInvoice(req, res, next) {
    try {
      const invoice = await quotationService.convertToInvoice(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { invoice }, 'Quotation converted to invoice successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuotation(req, res, next) {
    try {
      await quotationService.deleteQuotation(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Quotation archived successfully');
    } catch (error) {
      next(error);
    }
  }

  async duplicateQuotation(req, res, next) {
    try {
      const draft = await quotationService.duplicateQuotation(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { quotation: draft }, 'Quotation cloned as draft', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Quotation PDF
   */
  async getQuotationPdf(req, res, next) {
    try {
      const quotation = await quotationService.getById(req.user.tenantId, req.params.id);
      if (!quotation) return response.error(res, 'Quotation not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('quotation', { ...quotation }, branding);

      const clientName = (quotation.customer_name || '').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').substring(0, 50);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="quotation-${quotation.quote_number || quotation.id}-${clientName}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }
}

export default new QuotationsController();
