import { z } from 'zod';

export const reviewAdSchema = z.object({
  approved: z.boolean(),
  rejection_reason: z.string().optional(),
  internal_note: z.string().optional(),
});

export const flagAdSchema = z.object({
  reason: z.string().min(10),
  severity: z.enum(['low', 'medium', 'high']),
});

export type ReviewAdInput = z.infer<typeof reviewAdSchema>;
export type FlagAdInput = z.infer<typeof flagAdSchema>;
