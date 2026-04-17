import leadService from './lead.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * LeadsController — Industrialized Lead Management
 */
class LeadsController {
  
  async post_public_0(req, res, next) {
    try {
      const { lead, duplicates } = await leadService.createLead(
        req.tenant.id, 
        null, 
        { ...req.body, source: req.body.source || 'website' }, 
        'Public Site'
      );
      return response.success(res, { lead, isDuplicate: duplicates.length > 0 }, 'Lead captured', 201);
    } catch (error) {
      next(error);
    }
  }

  async get__1(req, res, next) {
    try {
      const result = await leadService.getAllLeads(req.user.tenantId, req.query);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async get_id_2(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.user.tenantId, req.params.id);
      if (!lead) return response.error(res, 'Lead not found', 404);
      return response.success(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async post__4(req, res, next) {
    try {
      const { lead, duplicates } = await leadService.createLead(
        req.user.tenantId,
        req.user.id,
        req.body,
        req.user.name
      );
      return response.success(res, { 
        lead, 
        isDuplicate: duplicates.length > 0, 
        duplicates 
      }, 'Lead created', 201);
    } catch (error) {
      next(error);
    }
  }

  async patch_id_5(req, res, next) {
    try {
      const lead = await leadService.updateLead(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, { lead });
    } catch (error) {
      next(error);
    }
  }

  async delete_id_6(req, res, next) {
    try {
      const result = await leadService.deleteLead(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Lead not found or already deleted', 404);
      return response.success(res, result, 'Lead archived successfully');
    } catch (error) {
      next(error);
    }
  }

  async get_id_booking_confirmation_pdf_3(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.user.tenantId, req.params.id);
      if (!lead) return response.error(res, 'Lead not found', 404);

      const branding = await fetchTenantBranding(supabaseAdmin, req.user.tenantId);
      const pdf = await generatePdf('booking_confirmation', lead, branding);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="booking-confirmation-${lead.id}.pdf"`);
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  }

  async post_id_assign_15(req, res, next) {
    try {
      const { assigned_to, silent } = req.body;
      const lead = await leadService.updateLead(req.user.tenantId, req.user.id, req.params.id, { assigned_to, silent });
      return response.success(res, { lead });
    } catch (error) {
      next(error);
    }
  }

  async post_bulk_assign_16(req, res, next) {
    try {
      const { lead_ids, assigned_to } = req.body;
      const results = { updated: 0, failed: 0 };
      for (const id of lead_ids) {
        try {
          await leadService.updateLead(req.user.tenantId, req.user.id, id, { assigned_to });
          results.updated++;
        } catch (e) { results.failed++; }
      }
      return response.success(res, { results }, `${results.updated} leads assigned`);
    } catch (error) {
      next(error);
    }
  }

  async post_bulk_status_17(req, res, next) {
    try {
      const { lead_ids, status } = req.body;
      const updatedLeads = await leadService.bulkUpdateStatus(req.user.tenantId, lead_ids, status);
      return response.success(res, { count: updatedLeads.length }, `${updatedLeads.length} leads updated`);
    } catch (error) {
      if (error.message.includes('required')) return response.error(res, error.message, 400);
      next(error);
    }
  }
}

export default new LeadsController();
