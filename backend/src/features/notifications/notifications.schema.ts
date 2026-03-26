import { z } from 'zod';

export const sendEmailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject required'),
  template: z.enum([
    'ad_approved',
    'ad_rejected',
    'payment_verified',
    'payment_rejected',
    'expiring_soon',
    'welcome',
  ]),
  data: z.record(z.any()).optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}
