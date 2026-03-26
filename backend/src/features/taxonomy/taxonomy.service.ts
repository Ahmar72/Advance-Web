import { createAdminSupabase } from '../../config/supabase';
import { Category, City } from '../../shared/types/database.types';

class TaxonomyService {
  /**
   * Get all active categories
   */
  async getCategories(): Promise<Category[]> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
    return data || [];
  }

  /**
   * Get all active cities
   */
  async getCities(): Promise<City[]> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(`Failed to fetch cities: ${error.message}`);
    return data || [];
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error('Category not found');
    return data;
  }

  /**
   * Get city by slug
   */
  async getCityBySlug(slug: string): Promise<City> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error('City not found');
    return data;
  }
}

export const taxonomyService = new TaxonomyService();
