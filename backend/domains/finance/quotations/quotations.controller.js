import quotationService from './quotation.service.js';
import invoiceService from '../invoices/invoice.service.js';
import response from '../../../core/utils/responseHandler.js';
import messageService from '../../../providers/communication/messageService.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * QuotationsController — Industrialized Proposal Management
 */
class QuotationsController {
  
  async get__0(req, res, next) {
    try {
      const data = await quotationService.listQuotations(req.user.tenantId, req.query);
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async get_share__token_8(req, res, next) {
    try {
      const { token } = req.params;
      const targetQuote = await quotationService.resolveLatestVersion(token);
      
      if (!targetQuote) return response.error(res, 'Quotation not found', 404);

      const data = await quotationService.getById(targetQuote.tenant_id, targetQuote.id);
      if (!data) return response.error(res, 'Quotation details could not be loaded', 404);

      // Secure costing context (strip margins for public view)
      const { total_cost_price, total_margin, ...publicData } = data;
      publicData.quotation_items = (data.quotation_items || []).map(({ cost_price, ...item }) => item);

      return response.success(res, { quotation: publicData, is_redirected: targetQuote.id !== token });
    } catch (error) {
      next(error);
    }
  }

  async get_id_1(req, res, next) {
    try {
      const data = await quotationService.getById(req.user.tenantId, req.params.id);
      if (!data) return response.error(res, 'Quotation not found', 404);

      // Dynamic WhatsApp Template Injection
      const shareLink = `https://intravos.travel/q/${data.share_token || data.id}`;
      const message = await messageService.renderFromDb(req.user.tenantId, 'quotation_share', {
        customer_name: data.customer_name,
        destination: data.destination || 'your trip',
        quote_link: shareLink,
        agency_name: req.tenant?.name || 'Intravos Travel'
      });

      data.whatsapp_share = {
        shareWithCustomer: data.customer_phone ? messageService.getWhatsAppLink(data.customer_phone, message) : null,
        shareGeneric: `https://wa.me/?text=${encodeURIComponent(message)}`
      };

      return response.success(res, { quotation: data });
    } catch (error) {
      next(error);
    }
  }

  async post__3(req, res, next) {
    try {
      const quotation = await quotationService.createQuotation(req.user.tenantId, req.user.id, req.body);
      return response.success(res, { quotation }, 'Quotation generated', 201);
    } catch (error) {
      next(error);
    }
  }

  async post_id_revise_6(req, res, next) {
    try {
      const revision = await quotationService.reviseQuotation(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { quotation: revision }, 'Revision created', 201);
    } catch (error) {
      next(error);
    }
  }

  async post_id_convert_to_invoice_7(req, res, next) {
    try {
      const invoice = await invoiceService.convertQuotationToInvoice(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { invoice }, 'Proposal converted to Invoice', 201);
    } catch (error) {
      next(error);
    }
  }

  async get_id_pdf_2(req, res, next) {
    try {
      const data = await quotationService.getById(req.user.tenantId, req.params.id);
      if (!data) return response.error(res, 'Quotation not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('quotation', data, branding);

      const clientName = (data.customer_name || '').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').substring(0, 50);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="quotation-${data.quote_number || data.id}-${clientName}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_4(req, res, next) {
    try {
      const quotation = await quotationService.updateQuotation(req.user.tenantId, req.params.id, req.body);
      return response.success(res, { quotation }, 'Quotation synchronized');
    } catch (error) {
      next(error);
    }
  }

  async delete_id_5(req, res, next) {
    try {
      await quotationService.deleteQuotation(req.user.tenantId, req.params.id);
      return response.success(res, null, 'Proposal removed from records');
    } catch (error) {
      next(error);
    }
  }

  async post_id_duplicate_9(req, res, next) {
    try {
      const draft = await quotationService.duplicateQuotation(req.user.tenantId, req.user.id, req.params.id);
      return response.success(res, { quotation: draft }, 'Proposal cloned as new draft', 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new QuotationsController();
