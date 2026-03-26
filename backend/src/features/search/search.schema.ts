import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query required').optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z
    .enum(['relevance', 'newest', 'price_asc', 'price_desc', 'popular'])
    .default('relevance'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
