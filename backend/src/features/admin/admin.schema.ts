import { z } from 'zod';

export const publishAdSchema = z.object({
  ad_id: z.string().uuid(),
  publish_at: z.string().datetime().optional(),
  is_featured: z.boolean().optional(),
});

export const adminUpdateAdSchema = z.object({
  status: z.string().optional(),
  rank_boost: z.number().optional(),
  is_featured: z.boolean().optional(),
});

export type PublishAdInput = z.infer<typeof publishAdSchema>;
export type AdminUpdateAdInput = z.infer<typeof adminUpdateAdSchema>;
