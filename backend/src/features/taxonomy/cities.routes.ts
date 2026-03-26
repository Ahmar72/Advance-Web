import { Router } from 'express';
import { taxonomyController } from './taxonomy.controller';

const router = Router();

/**
 * GET /api/v1/cities - Get all cities
 */
router.get('/', taxonomyController.getCities.bind(taxonomyController));

/**
 * GET /api/v1/cities/:slug - Get city by slug
 */
router.get(
  '/:slug',
  taxonomyController.getCityBySlug.bind(taxonomyController)
);

export default router;
