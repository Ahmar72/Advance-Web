import { Router } from 'express';
import { moderationController } from './moderation.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { requireAuth, requireRole } from '../../shared/middleware/auth.middleware';
import { reviewAdSchema, flagAdSchema } from './moderation.schema';

const router = Router();

// MODERATOR ONLY ROUTES

/**
 * GET /api/v1/moderator/queue - Get review queue
 */
router.get(
  '/',
  requireAuth,
  requireRole(['moderator', 'admin', 'super_admin']),
  moderationController.getReviewQueue.bind(moderationController)
);

/**
 * POST /api/v1/moderator/ads/:id/review - Review ad
 */
router.post(
  '/:id/review',
  requireAuth,
  requireRole(['moderator', 'admin', 'super_admin']),
  validateRequest(reviewAdSchema),
  moderationController.reviewAd.bind(moderationController)
);

/**
 * POST /api/v1/moderator/ads/:id/flag - Flag content
 */
router.post(
  '/:id/flag',
  requireAuth,
  requireRole(['moderator', 'admin', 'super_admin']),
  validateRequest(flagAdSchema),
  moderationController.flagContent.bind(moderationController)
);

export default router;
