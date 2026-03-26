import { z } from 'zod';

export const verifyPaymentSchema = z.object({
  payment_id: z.string().uuid('Invalid payment ID'),
  verified: z.boolean(),
  rejection_reason: z.string().optional(),
});

export const approvePaymentSchema = z.object({
  payment_id: z.string().uuid(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>;
