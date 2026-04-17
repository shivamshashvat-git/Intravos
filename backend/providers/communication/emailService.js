import logger from '../../core/utils/logger.js';

/**
 * emailService
 * Hardened utility for platform-wide transactional emails.
 * Supports Resend (preferred) and SendGrid as providers.
 * Falls back to dev-mode logging when no API key is configured.
 */
class EmailService {
  constructor() {
    this.resendKey = process.env.RESEND_API_KEY;
    this.sendgridKey = process.env.SENDGRID_API_KEY;
    this.provider = this.resendKey ? 'resend' : this.sendgridKey ? 'sendgrid' : null;
    this.fromEmail = process.env.EMAIL_FROM || 'Intravos <billing@intravos.com>';
    this.supportEmail = 'support@intravos.com';
  }

  async send(to, subject, html, text = '') {
    const recipients = Array.isArray(to) ? to : [to];

    if (!this.provider) {
      logger.info({ to: recipients, subject }, '[EmailService] DEV_MODE — no API key, logging only');
      return { success: true, mode: 'dev' };
    }

    try {
      if (this.provider === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: recipients,
            subject,
            html,
            text: text || undefined,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          logger.error({ status: response.status, body: errBody }, '[EmailService] Resend API error');
          return { success: false, mode: 'prod', error: errBody };
        }

        const result = await response.json();
        logger.info({ to: recipients, subject, id: result.id }, '[EmailService] Email sent via Resend');
        return { success: true, mode: 'prod', id: result.id };

      } else if (this.provider === 'sendgrid') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: recipients.map(email => ({ email })) }],
            from: { email: this.fromEmail.replace(/<|>/g, '').split(' ').pop() },
            subject,
            content: [
              { type: 'text/html', value: html },
              ...(text ? [{ type: 'text/plain', value: text }] : []),
            ],
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          logger.error({ status: response.status, body: errBody }, '[EmailService] SendGrid API error');
          return { success: false, mode: 'prod', error: errBody };
        }

        logger.info({ to: recipients, subject }, '[EmailService] Email sent via SendGrid');
        return { success: true, mode: 'prod' };
      }
    } catch (err) {
      logger.error({ err: err.message, to: recipients, subject }, '[EmailService] Send failed');
      return { success: false, mode: 'prod', error: err.message };
    }
  }

  async sendWelcomeEmail(email, name, agencyName) {
    const subject = `Welcome to the Future of Travel Operations, ${name}!`;
    const html = `
      <div style="font-family: sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #2b5cff;">Welcome to Intravos!</h2>
        <p>Hello ${name},</p>
        <p>Congratulations! Your agency, <strong>${agencyName}</strong>, is now powered by the Intravos Operating System.</p>
        <p>We've provisioned your workspace with intelligent demo data so you can experience the full power of our CRM and Itinerary Builder immediately.</p>
        <p><strong>Ready to go live?</strong> Visit your dashboard settings to activate your full production license.</p>
        <br>
        <p>To your success,<br>The Intravos Team</p>
      </div>
    `;
    return this.send(email, subject, html);
  }

  async sendInvoiceEmail(email, tenantName, invoiceNumber, amount) {
    const subject = `Invoice ${invoiceNumber} from Intravos Systems`;
    const html = `
      <div style="font-family: sans-serif; color: #1f2937;">
        <h3 style="color: #2b5cff;">New Statement Available</h3>
        <p>Hello ${tenantName},</p>
        <p>Your latest statement <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> has been generated and is ready for review.</p>
        <p>Please log in to your secure dashboard to settle this statement and maintain uninterrupted access to your travel operations suite.</p>
        <br>
        <p>Regards,<br>Intravos Finance Team</p>
      </div>
    `;
    return this.send(email, subject, html);
  }

  async sendTrialExpiryAlert(email, name, daysLeft) {
    const subject = `Action Required: Your Intravos Trial ends in ${daysLeft} days`;
    const html = `
      <div style="font-family: sans-serif; color: #1f2937;">
        <h3 style="color: #f59e0b;">Maintain Your Momentum</h3>
        <p>Hello ${name},</p>
        <p>Your high-fidelity trial of Intravos is concluding in <strong>${daysLeft} days</strong>.</p>
        <p>To ensure your agency doesn't lose access to its automated workflows and IvoBot intelligence, please upgrade to a production plan today.</p>
        <p><a href="https://intravos.com/billing" style="color: #2b5cff; font-weight: bold;">Upgrade My Agency Now →</a></p>
      </div>
    `;
    return this.send(email, subject, html);
  }

  async sendSecurityAlert(emails, userName, userEmail, ip, userAgent) {
    const subject = 'Security Alert: New Device Login';
    const html = `
      <p>Hello,</p>
      <p>We detected a login to the account <strong>${userName} (${userEmail})</strong> from a new IP Address or Device.</p>
      <p>IP: ${ip}<br>Device: ${userAgent}</p>
      <p>If this was allowed, you can ignore this alert. To prevent login sharing, please enforce individual accounts.</p>
    `;
    return this.send(emails, subject, html);
  }
}

export default new EmailService();
