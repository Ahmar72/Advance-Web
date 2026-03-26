import { createAdminSupabase } from '../../config/supabase';
import { Package } from '../../shared/types/database.types';

class PackagesService {
  /**
   * Get all active packages
   */
  async getPackages(): Promise<Package[]> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (error) throw new Error(`Failed to fetch packages: ${error.message}`);
    return data || [];
  }

  /**
   * Get package by ID
   */
  async getPackageById(packageId: string): Promise<Package> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (error) throw new Error('Package not found');
    return data;
  }
}

export const packagesService = new PackagesService();
