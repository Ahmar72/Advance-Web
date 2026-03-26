import { Router } from 'express';
import { learningController } from './learning.controller';

const router = Router();

/**
 * GET /api/v1/questions/random - Public learning question widget data
 */
router.get('/random', learningController.getRandomQuestion);

export default router;

