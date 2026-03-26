import { Request, Response } from 'express';
import { packagesService } from './packages.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class PackagesController {
  /**
   * GET /api/v1/packages - Get all packages
   */
  async getPackages(req: Request, res: Response): Promise<void> {
    try {
      const packages = await packagesService.getPackages();
      res.json(success(packages, 'Packages retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/packages/:id - Get package by ID
   */
  async getPackageById(req: Request, res: Response): Promise<void> {
    try {
      const pkg = await packagesService.getPackageById(req.params.id);
      res.json(success(pkg, 'Package retrieved'));
    } catch (err: any) {
      res.status(404).json(errorResponse(err.message, 404));
    }
  }
}

export const packagesController = new PackagesController();
