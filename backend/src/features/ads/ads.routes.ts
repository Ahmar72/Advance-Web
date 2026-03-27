import { Router } from 'express';
import { adsController } from './ads.controller';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { requireAuth, optionalAuth } from '../../shared/middleware/auth.middleware';
import {
  createAdSchema,
  editAdSchema,
  selectPackageSchema,
  submitPaymentProofSchema,
} from './ads.schema';

const router = Router();

// PUBLIC ROUTES

/**
 * GET /api/v1/ads - List public ads with search, filters, pagination
 */
router.get('/', optionalAuth, adsController.listPublicAds.bind(adsController));

/**
 * GET /api/v1/ads/:id - Get ad detail (public)
 */
router.get('/:id', adsController.getAd.bind(adsController));

// CLIENT ROUTES (Protected)

/**
 * POST /api/v1/ads - Create ad draft
 */
router.post(
  '/',
  requireAuth,
  validateRequest(createAdSchema),
  adsController.createAd.bind(adsController)
);

/**
 * GET /api/v1/client/ads - List user's own ads
 */
router.get('/admin/my-ads', requireAuth, adsController.getUserAds.bind(adsController));

/**
 * PATCH /api/v1/client/ads/:id - Edit own draft
 */
router.patch(
  '/:id',
  requireAuth,
  validateRequest(editAdSchema),
  adsController.updateAd.bind(adsController)
);

/**
 * DELETE /api/v1/ads/:id - Delete own draft
 */
router.delete(
  '/:id',
  requireAuth,
  adsController.deleteAd.bind(adsController)
);

/**
 * POST /api/v1/ads/:id/select-package - Select package and submit
 */
router.post(
  '/:id/select-package',
  requireAuth,
  validateRequest(selectPackageSchema),
  adsController.selectPackageAndSubmit.bind(adsController)
);

/**
 * POST /api/v1/client/payments - Submit payment proof
 */
router.post(
  '/:id/payment',
  requireAuth,
  validateRequest(submitPaymentProofSchema),
  adsController.submitPaymentProof.bind(adsController)
);

export default router;
