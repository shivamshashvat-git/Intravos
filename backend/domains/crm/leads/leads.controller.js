import leadService from './lead.service.js';
import response from '../../../core/utils/responseHandler.js';
import { generatePdf, fetchTenantBranding } from '../../../providers/pdf-engine/pdfEngine.js';
import { supabaseAdmin } from '../../../providers/database/supabase.js';

/**
 * LeadsController — Industrialized Lead Management
 */
class LeadsController {
  
  /**
   * Public lead capture (website forms)
   */
  async createPublicLead(req, res, next) {
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

  /**
   * List leads with filters
   */
  async listLeads(req, res, next) {
    try {
      const result = await leadService.getAllLeads(req.user.tenantId, req.query);
      return response.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch single lead details
   */
  async getLeadById(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.user.tenantId, req.params.id);
      if (!lead) return response.error(res, 'Lead not found', 404);
      return response.success(res, lead);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create lead manually
   */
  async createLead(req, res, next) {
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

  /**
   * Update lead details
   */
  async updateLead(req, res, next) {
    try {
      const lead = await leadService.updateLead(req.user.tenantId, req.user.id, req.params.id, req.body);
      return response.success(res, { lead });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft-delete/Archive lead
   */
  async deleteLead(req, res, next) {
    try {
      const result = await leadService.deleteLead(req.user.tenantId, req.user.id, req.params.id);
      if (!result) return response.error(res, 'Lead not found or already deleted', 404);
      return response.success(res, result, 'Lead archived successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Booking Confirmation PDF
   */
  async getLeadBookingPdf(req, res, next) {
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

  /**
   * Fetch lead modification history
   */
  async getLeadModifications(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'lead')
        .eq('entity_id', req.params.id)
        .eq('tenant_id', req.user.tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a note to a lead
   */
  async addLeadNote(req, res, next) {
    try {
      const { content } = req.body;
      const { data, error } = await supabaseAdmin
        .from('lead_notes')
        .insert({
          tenant_id: req.user.tenantId,
          lead_id: req.params.id,
          user_id: req.user.id,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      return response.success(res, data, 'Note added');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record a communication event
   */
  async recordLeadCommunication(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('engagement_log')
        .insert({
          ...req.body,
          tenant_id: req.user.tenantId,
          user_id: req.user.id,
          entity_type: 'lead',
          entity_id: req.params.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return response.success(res, data, 'Communication recorded');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get WhatsApp/Email share URLs
   */
  async getLeadShareUrls(req, res, next) {
    return response.error(res, 'Method not implemented in industrialized controller yet', 501);
  }

  /**
   * Get attachments for a lead
   */
  async getLeadAttachments(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('lead_attachments')
        .select('*')
        .eq('lead_id', req.params.id)
        .is('deleted_at', null);
      
      if (error) throw error;
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get lead documents
   */
  async getLeadDocuments(req, res, next) {
    try {
      const { data, error } = await supabaseAdmin
        .from('lead_documents')
        .select('*')
        .eq('lead_id', req.params.id)
        .is('deleted_at', null);
      
      if (error) throw error;
      return response.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a document for a lead
   */
  async uploadLeadDocument(req, res, next) {
    return response.error(res, 'Document upload requires industrialized storage provider integration', 501);
  }

  /**
   * Update lead document metadata
   */
  async updateLeadDocument(req, res, next) {
    return response.error(res, 'Method not implemented', 501);
  }

  /**
   * Delete lead attachment
   */
  async deleteLeadAttachment(req, res, next) {
    return response.error(res, 'Method not implemented', 501);
  }

  /**
   * Reassign lead to another staff member
   */
  async assignLead(req, res, next) {
    try {
      const { assigned_to, silent } = req.body;
      const lead = await leadService.updateLead(req.user.tenantId, req.user.id, req.params.id, { assigned_to, silent });
      return response.success(res, { lead });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mass reassignment of leads
   */
  async bulkAssignLeads(req, res, next) {
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

  /**
   * Mass status update of leads
   */
  async bulkUpdateLeadStatus(req, res, next) {
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
