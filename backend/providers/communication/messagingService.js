/**
 * MessagingService — Context-Aware WhatsApp Orchestrator
 * 
 * Instead of generic AI chat, Intravos provides highly optimized, 
 * pre-filled WhatsApp URLs that agents can use to communicate 
 * efficiently with leads and clients.
 */
class MessagingService {
  constructor() {
    this.templates = {
      INQUIRY_RECEIVED: "Hi {name}! Thanks for reaching out to Intravos. We've received your inquiry for a trip to {destination}. Our experts are looking into it and will get back to you shortly.",
      QUOTE_READY: "Great news {name}! Your customized itinerary for {destination} is ready. Total Estimate: {price}. Check it out here: {link}",
      BOOKING_CONFIRMED: "Booking Confirmed! ✈️ {name}, your trip to {destination} is officially locked in. We've sent the details to your email. Get ready for an amazing journey!",
      PAYMENT_REMINDER: "Friendly reminder from Intravos: A payment of {balance} is due for your upcoming {destination} trip. Please settle it by {date} to avoid any issues."
    };
  }

  /**
   * Generates a wa.me URL with a pre-filled message
   * @param {string} phone - Recipient phone number
   * @param {string} templateKey - Key of the template to use
   * @param {object} data - Dynamic data for replacement
   */
  generateWhatsAppUrl(phone, templateKey, data) {
    if (!phone) return null;

    let message = this.templates[templateKey] || templateKey;

    // Handle dynamic replacements
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, data[key]);
    });

    // Sanitize phone (remove + and spaces if needed for the URL)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * List available templates for the UI to pick from
   */
  getTemplates() {
    return Object.keys(this.templates).map(key => ({
      id: key,
      label: key.replace(/_/g, ' ').toLowerCase(),
      preview: this.templates[key]
    }));
  }
}

export default new MessagingService();
