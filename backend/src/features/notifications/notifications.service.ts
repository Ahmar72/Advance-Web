import { env } from '../../config/env';
import { EmailTemplate, SendEmailInput } from './notifications.schema';

/**
 * Email notification service
 * Currently configured to use SendGrid
 */
export class NotificationService {
  private sendGridApiKey = env.SENDGRID_API_KEY;
  private fromEmail = env.SENDGRID_FROM_EMAIL || 'noreply@adflowpro.com';

  /**
   * Send email via SendGrid
   * Requires sendgrid package: npm install @sendgrid/mail
   */
  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!this.sendGridApiKey) {
      console.warn('SendGrid API key not configured. Email not sent to:', input.to);
      // In development, just log the email that would be sent
      console.log('Email that would be sent:', {
        to: input.to,
        subject: input.subject,
        template: input.template,
      });
      return;
    }

    try {
      // Dynamically import to avoid hard dependency
      // @ts-ignore - sendgrid is optional, installed separately
      const sgMail = await import('@sendgrid/mail').then((m) => m.default);
      sgMail.setApiKey(this.sendGridApiKey);

      const template = this.getTemplate(input.template, input.data || {});

      await sgMail.send({
        to: input.to,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Email sent to ${input.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      // In production, you'd want to log this to a database for retry
      throw new Error(`Email delivery failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get email template by name and render with data
   */
  private getTemplate(templateName: string, data: Record<string, any>): EmailTemplate {
    const templates: Record<string, (data: any) => EmailTemplate> = {
      ad_approved: (data) => ({
        subject: `Your listing "${data.adTitle}" has been approved!`,
        html: `
          <h2>Great news!</h2>
          <p>Your ad "<strong>${data.adTitle}</strong>" has been approved and will be published soon.</p>
          <p><strong>Next step:</strong> Please complete payment to publish your listing.</p>
          <a href="${data.dashboardUrl}">View in Dashboard</a>
        `,
        text: `Your ad "${data.adTitle}" has been approved. Visit your dashboard to continue.`,
      }),

      ad_rejected: (data) => ({
        subject: `Listing "${data.adTitle}" was not approved`,
        html: `
          <h2>Listing Review Result</h2>
          <p>Unfortunately, your ad "<strong>${data.adTitle}</strong>" was not approved.</p>
          <p><strong>Reason:</strong> ${data.rejectionReason || 'Does not meet our posting guidelines'}</p>
          <p>You can edit and resubmit your listing.</p>
          <a href="${data.dashboardUrl}">View in Dashboard</a>
        `,
        text: `Your ad "${data.adTitle}" was rejected. Reason: ${data.rejectionReason}`,
      }),

      payment_verified: (data) => ({
        subject: `Payment confirmed for "${data.adTitle}"`,
        html: `
          <h2>Payment Received</h2>
          <p>Thank you! Your payment has been verified.</p>
          <p>Your listing "<strong>${data.adTitle}</strong>" is now <strong>LIVE</strong>.</p>
          <p>Valid until: <strong>${data.expiresOn}</strong></p>
          <a href="${data.listingUrl}">View Your Listing</a>
        `,
        text: `Your payment is confirmed. Your listing "${data.adTitle}" is now live.`,
      }),

      payment_rejected: (data) => ({
        subject: `Payment unsuccessful for "${data.adTitle}"`,
        html: `
          <h2>Payment Issue</h2>
          <p>Your payment for "<strong>${data.adTitle}</strong>" could not be verified.</p>
          <p><strong>Reason:</strong> ${data.rejectionReason || 'Payment method declined'}</p>
          <p>Please try again with a different payment method.</p>
          <a href="${data.dashboardUrl}">Retry Payment</a>
        `,
        text: `Payment failed for "${data.adTitle}". Reason: ${data.rejectionReason}`,
      }),

      expiring_soon: (data) => ({
        subject: `Your listing "${data.adTitle}" expires in ${data.daysLeft} days`,
        html: `
          <h2>Listing Expiring Soon</h2>
          <p>Your ad "<strong>${data.adTitle}</strong>" will expire on <strong>${data.expiresOn}</strong>.</p>
          <p>Renew now to keep your listing active and reach more buyers.</p>
          <a href="${data.renewUrl}">Renew Listing</a>
        `,
        text: `Your listing "${data.adTitle}" expires in ${data.daysLeft} days. Renew it now.`,
      }),

      welcome: (data) => ({
        subject: 'Welcome to AdFlow Pro!',
        html: `
          <h2>Welcome to AdFlow Pro</h2>
          <p>Hi ${data.userName},</p>
          <p>Thank you for creating an account. You're now ready to post your first ad.</p>
          <p><strong>Get started:</strong></p>
          <ol>
            <li>Verify your email (if needed)</li>
            <li>Create your first listing</li>
            <li>Go live and reach buyers</li>
          </ol>
          <a href="${data.createAdUrl}">Post Your First Ad</a>
        `,
        text: 'Welcome to AdFlow Pro! Get started by posting your first listing.',
      }),
    };

    const templateFn = templates[templateName];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    return templateFn(data);
  }

  /**
   * Precompiled template for ad approval
   */
  async notifyAdApproved(
    email: string,
    adTitle: string,
    dashboardUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Your listing "${adTitle}" has been approved!`,
      template: 'ad_approved',
      data: { adTitle, dashboardUrl },
    });
  }

  /**
   * Precompiled template for ad rejection
   */
  async notifyAdRejected(
    email: string,
    adTitle: string,
    rejectionReason: string,
    dashboardUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Listing "${adTitle}" was not approved`,
      template: 'ad_rejected',
      data: { adTitle, rejectionReason, dashboardUrl },
    });
  }

  /**
   * Precompiled template for payment verification
   */
  async notifyPaymentVerified(
    email: string,
    adTitle: string,
    expiresOn: string,
    listingUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Payment confirmed for "${adTitle}"`,
      template: 'payment_verified',
      data: { adTitle, expiresOn, listingUrl },
    });
  }

  /**
   * Precompiled template for payment rejection
   */
  async notifyPaymentRejected(
    email: string,
    adTitle: string,
    rejectionReason: string,
    dashboardUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Payment unsuccessful for "${adTitle}"`,
      template: 'payment_rejected',
      data: { adTitle, rejectionReason, dashboardUrl },
    });
  }

  /**
   * Precompiled template for expiring listing
   */
  async notifyExpiringListing(
    email: string,
    adTitle: string,
    daysLeft: number,
    expiresOn: string,
    renewUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: `Your listing "${adTitle}" expires in ${daysLeft} days`,
      template: 'expiring_soon',
      data: { adTitle, daysLeft, expiresOn, renewUrl },
    });
  }

  /**
   * Precompiled template for welcome email
   */
  async notifyWelcome(
    email: string,
    userName: string,
    createAdUrl: string
  ): Promise<void> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to AdFlow Pro!',
      template: 'welcome',
      data: { userName, createAdUrl },
    });
  }
}

export const notificationService = new NotificationService();
