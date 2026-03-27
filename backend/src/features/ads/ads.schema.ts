import { z } from 'zod';

export const createAdSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  // Allow any non-empty string IDs; backend/DB will enforce actual FK validity
  category_id: z.string().min(1, 'Category is required'),
  city_id: z.string().min(1, 'City is required'),
  // Frontend may send YouTube links, http URLs, or other strings; only require non-empty
  media_urls: z
    .array(z.string().min(1, 'Media URL cannot be empty'))
    .min(1, 'At least one media URL is required')
    .max(10, 'Maximum 10 media URLs allowed'),
});

export const editAdSchema = createAdSchema.partial();

export const selectPackageSchema = z.object({
  package_id: z.string().uuid('Invalid package ID'),
});

export const submitPaymentProofSchema = z.object({
  package_id: z.string().uuid('Invalid package ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['bank_transfer', 'card', 'mobile_wallet', 'cash']),
  transaction_ref: z.string().min(5, 'Invalid transaction reference'),
  sender_name: z.string().min(2, 'Sender name required'),
  screenshot_url: z.string().url('Invalid screenshot URL').optional(),
});

export const statusTransitionSchema = z.object({
  new_status: z.enum([
    'draft',
    'under_review',
    'payment_pending',
    'payment_submitted',
    'payment_verified',
    'scheduled',
    'published',
    'expired',
    'rejected',
    'archived',
  ]),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export const publishScheduleSchema = z.object({
  publish_at: z.string().datetime('Invalid datetime format'),
});

export const adListQuerySchema = z.object({
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  city_id: z.string().uuid().optional(),
  sort: z.enum(['newest', 'rank', 'expiring_soon']).optional().default('rank'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(5).max(100).optional().default(20),
});

// Type inference for request bodies
export type CreateAdInput = z.infer<typeof createAdSchema>;
export type EditAdInput = z.infer<typeof editAdSchema>;
export type SelectPackageInput = z.infer<typeof selectPackageSchema>;
export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type PublishScheduleInput = z.infer<typeof publishScheduleSchema>;
export type AdListQuery = z.infer<typeof adListQuerySchema>;
