import { Request, Response } from 'express';
import { adsService } from './ads.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class AdsController {
  /**
   * POST /api/v1/ads - Create new ad draft
   */
  async createAd(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      const ad = await adsService.createAd(userId, req.body);
      res.status(201).json(success(ad, 'Ad created successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/ads - List public ads with filters
   */
  async listPublicAds(req: Request, res: Response): Promise<void> {
    try {
      const result = await adsService.listPublicAds(req.query as any);
      res.json(success(result, 'Ads retrieved successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/ads/:id - Get ad details
   */
  async getAd(req: Request, res: Response): Promise<void> {
    try {
      const ad = await adsService.getAdById(req.params.id);
      res.json(success(ad, 'Ad retrieved successfully'));
    } catch (err: any) {
      res.status(404).json(errorResponse(err.message, 404));
    }
  }

  /**
   * GET /api/v1/client/ads - List user's own ads
   */
  async getUserAds(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adsService.getUserAds(userId, page, limit);
      res.json(success(result, 'User ads retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * PATCH /api/v1/client/ads/:id - Edit own draft ad
   */
  async updateAd(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      const ad = await adsService.updateAd(userId, req.params.id, req.body);
      res.json(success(ad, 'Ad updated successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * POST /api/v1/client/ads/:id/select-package - Select package and submit
   */
  async selectPackageAndSubmit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      const ad = await adsService.selectPackageAndSubmit(userId, req.params.id, req.body);
      res.json(success(ad, 'Ad submitted for review'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * POST /api/v1/client/payments - Submit payment proof
   */
  async submitPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse('Unauthorized', 401));
        return;
      }

      // Route is mounted as POST /api/v1/ads/:id/payment
      // The controller should use the URL param for the ad id.
      const adId = req.params.id;
      const payment = await adsService.submitPaymentProof(userId, adId, req.body);
      res.status(201).json(success(payment, 'Payment proof submitted'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const adsController = new AdsController();
