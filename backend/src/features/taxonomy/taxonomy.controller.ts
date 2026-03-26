import { Request, Response } from 'express';
import { taxonomyService } from './taxonomy.service';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class TaxonomyController {
  /**
   * GET /api/v1/categories - Get all categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await taxonomyService.getCategories();
      res.json(success(categories, 'Categories retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/cities - Get all cities
   */
  async getCities(req: Request, res: Response): Promise<void> {
    try {
      const cities = await taxonomyService.getCities();
      res.json(success(cities, 'Cities retrieved'));
    } catch (err: any) {
      res.status(400).json(errorResponse(err.message));
    }
  }

  /**
   * GET /api/v1/categories/:slug - Get category by slug
   */
  async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    try {
      const category = await taxonomyService.getCategoryBySlug(req.params.slug);
      res.json(success(category, 'Category retrieved'));
    } catch (err: any) {
      res.status(404).json(errorResponse(err.message, 404));
    }
  }

  /**
   * GET /api/v1/cities/:slug - Get city by slug
   */
  async getCityBySlug(req: Request, res: Response): Promise<void> {
    try {
      const city = await taxonomyService.getCityBySlug(req.params.slug);
      res.json(success(city, 'City retrieved'));
    } catch (err: any) {
      res.status(404).json(errorResponse(err.message, 404));
    }
  }
}

export const taxonomyController = new TaxonomyController();
