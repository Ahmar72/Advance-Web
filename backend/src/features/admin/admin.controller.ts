import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class AdminController {
  /**
   * GET /api/v1/admin/dashboard - Get admin dashboard metrics
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await adminService.getDashboardMetrics();
      res.json(success(metrics, 'Dashboard metrics retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * POST /api/v1/admin/ads/:id/publish - Publish ad
   */
  async publishAd(req: Request, res: Response): Promise<void> {
    try {
      const ad = await adminService.publishAd(req.params.id, req.body);
      res.json(success(ad, 'Ad published successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * PATCH /api/v1/admin/ads/:id - Update ad as admin
   */
  async updateAd(req: Request, res: Response): Promise<void> {
    try {
      const ad = await adminService.updateAdAsAdmin(req.params.id, req.body);
      res.json(success(ad, 'Ad updated successfully'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/admin/packages - Get all packages
   */
  async getPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = await adminService.getPackages();
      res.json(success(packages, 'Packages retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }
}

export const adminController = new AdminController();
