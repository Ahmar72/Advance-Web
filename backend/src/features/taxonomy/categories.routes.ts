import { Router } from 'express';
import { taxonomyController } from './taxonomy.controller';

const router = Router();

/**
 * GET /api/v1/categories - Get all categories
 */
router.get('/', taxonomyController.getCategories.bind(taxonomyController));

/**
 * GET /api/v1/categories/:slug - Get category by slug
 */
router.get(
  '/:slug',
  taxonomyController.getCategoryBySlug.bind(taxonomyController)
);

export default router;
