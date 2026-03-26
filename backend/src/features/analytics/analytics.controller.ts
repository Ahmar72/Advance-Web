import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics - Get full dashboard analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await analyticsService.getAnalytics();
      res.json(success(analytics, 'Analytics retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/analytics/revenue - Get revenue timeline
   */
  async getRevenueTimeline(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const timeline = await analyticsService.getRevenueTimeline(days);
      res.json(success(timeline, 'Revenue timeline retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/analytics/status-distribution - Get status distribution
   */
  async getStatusDistribution(req: Request, res: Response): Promise<void> {
    try {
      const distribution = await analyticsService.getStatusDistribution();
      res.json(success(distribution, 'Status distribution retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const analyticsController = new AnalyticsController();
