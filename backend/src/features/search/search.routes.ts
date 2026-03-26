import { Router } from 'express';
import { searchController } from './search.controller';

const router = Router();

/**
 * @route GET /api/v1/search
 * @desc Search published ads with filters and full-text support
 * @query q - Search query (optional)
 * @query category - Filter by category slug (optional)
 * @query city - Filter by city slug (optional)
 * @query minPrice - Filter by minimum price (optional)
 * @query maxPrice - Filter by maximum price (optional)
 * @query sortBy - Sort order: relevance|newest|price_asc|price_desc|popular (default: relevance)
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20, max: 100)
 * @returns {SearchResponse} Search results with pagination
 */
router.get('/', searchController.search.bind(searchController));

/**
 * @route GET /api/v1/search/suggestions
 * @desc Get autocomplete suggestions based on partial query
 * @query q - Partial search query (min 2 chars)
 * @returns {string[]} List of matching ad titles
 */
router.get('/suggestions', searchController.getSuggestions.bind(searchController));

/**
 * @route GET /api/v1/search/trending
 * @desc Get trending searches
 * @query limit - Number of results (default: 10, max: 50)
 * @returns {string[]} List of trending category names
 */
router.get('/trending', searchController.getTrending.bind(searchController));

export default router;
