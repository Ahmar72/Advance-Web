import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware';

const router = Router();

// ADMIN ONLY ROUTES

/**
 * GET /api/v1/analytics - Get dashboard analytics
 */
router.get(
  '/',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  analyticsController.getAnalytics.bind(analyticsController)
);

/**
 * GET /api/v1/analytics/revenue - Get revenue timeline
 */
router.get(
  '/revenue',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  analyticsController.getRevenueTimeline.bind(analyticsController)
);

/**
 * GET /api/v1/analytics/status-distribution - Get status distribution
 */
router.get(
  '/status-distribution',
  requireAuth,
  requireRole(['admin', 'super_admin']),
  analyticsController.getStatusDistribution.bind(analyticsController)
);

export default router;
