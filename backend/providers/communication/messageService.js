import Handlebars from 'handlebars';
import logger from '../../core/utils/logger.js';
import { supabaseAdmin } from '../database/supabase.js';

/**
 * MessageService
 * Centralized engine for WhatsApp, SMS, and Email templates.
 * Uses Handlebars for dynamic rendering.
 */
class MessageService {
  /**
   * Renders a template string with provided data context.
   * @param {string} templateBody - The Handlebars template string
   * @param {object} context - Data object for variables
   * @returns {string} Rendered message
   */
  render(templateBody, context = {}) {
    if (!templateBody) return '';
    try {
      const template = Handlebars.compile(templateBody);
      return template(context);
    } catch (err) {
      logger.error('[MessageService] Rendering Error:', err.message);
      return templateBody; // Fallback to raw text
    }
  }

  /**
   * Fetches a template from the database and renders it.
   * @param {string} tenantId - Tenant ID for isolation
   * @param {string} occasionType - e.g., 'lead_welcome', 'quotation_share'
   * @param {object} context - Data object
   * @returns {Promise<string>} Rendered message
   */
  async renderFromDb(tenantId, occasionType, context = {}) {
    const { data: template, error } = await supabaseAdmin
      .from('message_templates')
      .select('template_text')
      .eq('tenant_id', tenantId)
      .eq('occasion_type', occasionType)
      .maybeSingle();

    if (error || !template) {
      // Return a default if no customization found
      return this.render(this.getDefault(occasionType), context);
    }

    return this.render(template.template_text, context);
  }

  /**
   * Sanitizes phone number and generates a WhatsApp deep link.
   * @param {string} phone - Target phone number
   * @param {string} message - Pre-rendered message text
   * @returns {string} wa.me URL
   */
  getWhatsAppLink(phone, message) {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const encodedMsg = encodeURIComponent(message || '');
    return `https://wa.me/${cleanPhone}${encodedMsg ? '?text=' + encodedMsg : ''}`;
  }

  /**
   * Hardcoded defaults for when no DB template is available.
   */
  getDefault(type) {
    const defaults = {
      'lead_welcome': 'Hi {{customer_name}}! 🌟 Thank you for choosing us for your {{destination}} enquiry. Our travel experts are crafting a personalized itinerary for you. We\'ll be in touch shortly!',
      'quotation_share': 'Hello {{customer_name}}, your custom-crafted travel experience for {{destination}} is ready for preview! ✨ View your personalized itinerary here: {{quote_link}}',
      'booking_confirmed': 'Congratulations {{customer_name}}! 🎉 Your journey to {{destination}} is officially confirmed. Booking Ref: {{booking_ref}}. We are excited to host you!',
      'payment_receipt': 'Payment Confirmation: We have successfully received {{amount}} for your {{destination}} trip. Thank you for your payment! 🙏',
      'voucher_share': 'Hi {{customer_name}}, your digital travel vouchers for {{destination}} are secured and ready for download. 📂 View them here: {{voucher_link}}'
    };
    return defaults[type] || '';
  }
}

export default new MessageService();
