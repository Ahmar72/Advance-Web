export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  city: string;
  image_url: string | null;
  seller_name: string;
  seller_verified: boolean;
  status: string;
  created_at: string;
  relevance_score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  query: string;
  filters: {
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}
