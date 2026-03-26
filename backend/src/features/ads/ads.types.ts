// Types specific to the Ads feature
import { Ad, AdMedia, User, SellerProfile, Category, City, Package, AdStatusHistory } from '../../shared/types/database.types';

export interface AdDetailResponse extends Ad {
  media: AdMedia[];
  seller: SellerProfile | null;
  category: Category;
  city: City;
  package: Package;
  status_history: AdStatusHistory[];
}

export interface AdCreateDto {
  title: string;
  description: string;
  category_id: string;
  city_id: string;
  media_urls: string[]; // External URLs
}

export interface AdEditDto {
  title?: string;
  description?: string;
  category_id?: string;
  city_id?: string;
  media_urls?: string[];
}

export interface AdListQuery {
  search?: string;
  category_id?: string;
  city_id?: string;
  sort?: 'newest' | 'rank' | 'expiring_soon';
  page?: number;
  limit?: number;
}

export interface AdListResponse {
  data: AdDetailResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StatusTransitionRequest {
  new_status: string;
  reason?: string;
  note?: string;
}
