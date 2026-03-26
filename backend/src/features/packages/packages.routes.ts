import { Router } from 'express';
import { packagesController } from './packages.controller';

const router = Router();

/**
 * GET /api/v1/packages - Get all packages
 */
router.get('/', packagesController.getPackages.bind(packagesController));

/**
 * GET /api/v1/packages/:id - Get package by ID
 */
router.get(
  '/:id',
  packagesController.getPackageById.bind(packagesController)
);

export default router;
