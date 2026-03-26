import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware';
import { verifyPaymentSchema } from './payments.schema';

const router = Router();

// ADMIN ONLY ROUTES

/**
 * GET /api/v1/admin/payments - Get payment queue
 */
router.get(
  '/',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  paymentsController.getPaymentQueue.bind(paymentsController)
);

/**
 * GET /api/v1/admin/payments/:id - Get payment details
 */
router.get(
  '/:id',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  paymentsController.getPayment.bind(paymentsController)
);

/**
 * POST /api/v1/admin/payments/:id/verify - Verify or reject payment
 */
router.post(
  '/:id/verify',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  validateRequest(verifyPaymentSchema),
  paymentsController.verifyPayment.bind(paymentsController)
);

export default router;
