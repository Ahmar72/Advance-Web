import { Request, Response } from 'express';
import { learningService } from './learning.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class LearningController {
  /**
   * GET /api/v1/questions/random
   */
  async getRandomQuestion(req: Request, res: Response): Promise<void> {
    try {
      const question = await learningService.getRandomActiveQuestion();
      res.json(success(question, 'Learning question retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const learningController = new LearningController();

