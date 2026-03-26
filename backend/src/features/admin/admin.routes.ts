import { Router } from 'express';
import { adminController } from './admin.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware';
import { publishAdSchema, adminUpdateAdSchema } from './admin.schema';

const router = Router();

// ADMIN ONLY ROUTES

/**
 * GET /api/v1/admin/dashboard - Get dashboard metrics
 */
router.get(
  '/dashboard',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  adminController.getDashboard.bind(adminController)
);

/**
 * POST /api/v1/admin/ads/:id/publish - Publish ad
 */
router.post(
  '/ads/:id/publish',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  validateRequest(publishAdSchema),
  adminController.publishAd.bind(adminController)
);

/**
 * PATCH /api/v1/admin/ads/:id - Update ad
 */
router.patch(
  '/ads/:id',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  validateRequest(adminUpdateAdSchema),
  adminController.updateAd.bind(adminController)
);

/**
 * GET /api/v1/admin/packages - Get packages
 */
router.get(
  '/packages',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  adminController.getPackages.bind(adminController)
);

export default router;
