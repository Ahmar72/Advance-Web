import { createAdminSupabase } from '../../config/supabase';
import { SearchQuery, searchQuerySchema } from './search.schema';
import { SearchResult } from './search.types';

export class SearchService {
  async search(
    query: SearchQuery
  ): Promise<{
    results: SearchResult[];
    total: number;
    pages: number;
  }> {
    const supabase = createAdminSupabase();
    // Validate query
    const validatedQuery = searchQuerySchema.parse(query);

    // Build base query for published ads
    let dbQuery = supabase
      .from('ads')
      .select(
        `
        id,
        title,
        description,
        package_id,
        category_id,
        city_id,
        media_urls,
        price_range,
        status,
        created_at,
        user_id,
        view_count,
        packages (name, min_price, max_price),
        categories (name, slug),
        cities (name, slug),
        users (full_name, is_verified_seller)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .order(
        validatedQuery.sortBy === 'newest'
          ? 'created_at'
          : validatedQuery.sortBy === 'popular'
            ? 'view_count'
            : 'title',
        {
          ascending:
            validatedQuery.sortBy === 'price_asc' ||
            validatedQuery.sortBy === 'newest',
        }
      );

    // Full-text search if query provided
    if (validatedQuery.q) {
      const searchTerm = validatedQuery.q.trim();
      // Use Postgres full-text search with to_tsquery
      dbQuery = dbQuery.or(
        `title.icontains.${searchTerm},description.icontains.${searchTerm}`
      );
    }

    // Category filter
    if (validatedQuery.category) {
      dbQuery = dbQuery.eq('categories.slug', validatedQuery.category);
    }

    // City filter
    if (validatedQuery.city) {
      dbQuery = dbQuery.eq('cities.slug', validatedQuery.city);
    }

    // Price range filter
    if (validatedQuery.minPrice !== undefined) {
      dbQuery = dbQuery.gte(
        'price_range',
        `[${validatedQuery.minPrice},`
      );
    }
    if (validatedQuery.maxPrice !== undefined) {
      dbQuery = dbQuery.lte(
        'price_range',
        `,${validatedQuery.maxPrice}]`
      );
    }

    // Pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    dbQuery = dbQuery.range(offset, offset + validatedQuery.limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    const total = count || 0;
    const pages = Math.ceil(total / validatedQuery.limit);

    // Transform results
    const results: SearchResult[] = (data || [])
      .map((ad: any) => {
        // Calculate relevance score based on match quality
        let relevanceScore = 1;
        if (validatedQuery.q) {
          const searchTerm = validatedQuery.q.toLowerCase();
          if (ad.title.toLowerCase().includes(searchTerm)) {
            relevanceScore += 2; // Title match = higher relevance
          }
          if (ad.description.toLowerCase().includes(searchTerm)) {
            relevanceScore += 1;
          }
        }

        // Boost verified sellers
        if (ad.users?.is_verified_seller) {
          relevanceScore += 0.5;
        }

        return {
          id: ad.id,
          title: ad.title,
          description: ad.description.substring(0, 150),
          price: ad.packages?.[0]?.min_price || 0,
          category: ad.categories?.[0]?.name || 'Unknown',
          city: ad.cities?.[0]?.name || 'Unknown',
          image_url: ad.media_urls?.[0] || null,
          seller_name: ad.users?.full_name || 'Unknown',
          seller_verified: ad.users?.is_verified_seller || false,
          status: ad.status,
          created_at: ad.created_at,
          relevance_score: relevanceScore,
        };
      })
      .sort((a, b) => {
        if (validatedQuery.sortBy === 'relevance') {
          return (b.relevance_score || 0) - (a.relevance_score || 0);
        }
        return 0;
      });

    return {
      results,
      total,
      pages,
    };
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const supabase = createAdminSupabase();
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();

    const { data, error } = await supabase
      .from('ads')
      .select('title')
      .eq('status', 'published')
      .filter('title', 'ilike', `%${searchTerm}%`)
      .limit(limit);

    if (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }

    // Extract unique titles and truncate
    const suggestions = Array.from(
      new Set((data || []).map((ad: any) => ad.title))
    ) as string[];

    return suggestions.slice(0, limit);
  }

  /**
   * Get trending searches (optional: based on query frequency)
   */
  async getTrendingSearches(limit: number = 10): Promise<string[]> {
    const supabase = createAdminSupabase();
    // This would require a search_logs table to track queries
    // For now, return popular categories as trending
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('ad_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch trending searches:', error);
      return [];
    }

    return (data || []).map((cat: any) => cat.name);
  }
}

export const searchService = new SearchService();
