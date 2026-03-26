import { NextFunction, Request, Response } from 'express';
import { searchService } from './search.service';
import { searchQuerySchema } from './search.schema';
import { success, error as errorResponse } from '../../shared/utils/response.util';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = searchQuerySchema.parse(req.query);
      const { results, total, pages } = await searchService.search(query);

      return res.json(
        success({
          results,
          total,
          page: query.page,
          limit: query.limit,
          pages,
          query: query.q || '',
          filters: {
            category: query.category,
            city: query.city,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
          },
        }, 'Search results found')
      );
    } catch (err) {
      next(err);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return res.json(success({ suggestions: [] }, 'Suggestions'));
      }

      const suggestions = await searchService.getSuggestions(q);

      return res.json(success({ suggestions }, 'Search suggestions'));
    } catch (err) {
      next(err);
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const trendingLimit = limit ? parseInt(limit as string) : 10;

      const trending = await searchService.getTrendingSearches(trendingLimit);

      return res.json(success({ trending }, 'Trending searches'));
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
