import { Request, Response } from 'express';
import { moderationService } from './moderation.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class ModerationController {
  /**
   * GET /api/v1/moderator/queue - Get ads for review
   */
  async getReviewQueue(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await moderationService.getReviewQueue(page, limit);
      res.json(success(result, 'Review queue retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * POST /api/v1/moderator/ads/:id/review - Review ad
   */
  async reviewAd(req: Request, res: Response): Promise<void> {
    try {
      const moderatorId = req.user?.id;
      if (!moderatorId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      const ad = await moderationService.reviewAd(moderatorId, req.params.id, req.body);
      res.json(success(ad, 'Ad reviewed successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * POST /api/v1/moderator/ads/:id/flag - Flag content
   */
  async flagContent(req: Request, res: Response): Promise<void> {
    try {
      const { reason, severity } = req.body;
      await moderationService.flagContent(req.params.id, reason, severity);
      res.json(success(null, 'Content flagged'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const moderationController = new ModerationController();
