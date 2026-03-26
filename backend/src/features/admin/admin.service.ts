import { createAdminSupabase } from '../../config/supabase';
import { PublishAdInput, AdminUpdateAdInput } from './admin.schema';

class AdminService {
  /**
   * Get admin dashboard metrics
   */
  async getDashboardMetrics(): Promise<any> {
    const supabase = createAdminSupabase();
    // Total ads by status
    const { data: adsByStatus } = await supabase
      .from('ads')
      .select('status', { count: 'exact' });

    // Total revenue
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'verified');

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Active ads
    const now = new Date().toISOString();
    const { data: activeAds, count: activeCount } = await supabase
      .from('ads')
      .select('id', { count: 'exact' })
      .eq('status', 'published')
      .gt('expire_at', now);

    // Moderator stats
    const { data: rejectedAds } = await supabase
      .from('ads')
      .select('id', { count: 'exact' })
      .eq('status', 'rejected');

    return {
      total_ads: adsByStatus?.length || 0,
      active_ads: activeCount || 0,
      total_revenue: totalRevenue,
      rejected_ads: rejectedAds?.length || 0,
    };
  }

  /**
   * Publish an ad immediately
   */
  async publishAd(adId: string, input?: PublishAdInput): Promise<any> {
    const supabase = createAdminSupabase();
    const ad = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (!ad.data) throw new Error('Ad not found');

    const now = new Date();
    const publishDate = input?.publish_at ? new Date(input.publish_at) : now;

    // Get package duration
    const pkg = await supabase
      .from('packages')
      .select('duration_days')
      .eq('id', ad.data.package_id)
      .single();

    const expireDate = new Date(publishDate);
    if (pkg.data) {
      expireDate.setDate(expireDate.getDate() + pkg.data.duration_days);
    }

    const { data: updated, error } = await supabase
      .from('ads')
      .update({
        status: 'published',
        publish_at: publishDate.toISOString(),
        expire_at: expireDate.toISOString(),
        is_featured: input?.is_featured,
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to publish ad: ${error.message}`);

    // Log status change
    await supabase.from('ad_status_history').insert({
      ad_id: adId,
      previous_status: ad.data.status,
      new_status: 'published',
      note: 'Published by admin',
      created_at: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Update ad (admin override)
   */
  async updateAdAsAdmin(adId: string, input: AdminUpdateAdInput): Promise<any> {
    const supabase = createAdminSupabase();
    const updateData: any = {};
    if (input.status) updateData.status = input.status;
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;
    if (input.rank_boost) updateData.admin_boost = input.rank_boost;

    const { data: updated, error } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update ad: ${error.message}`);

    return updated;
  }

  /**
   * Get all packages (for admin)
   */
  async getPackages(): Promise<any> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error('Failed to fetch packages');
    return data;
  }
}

export const adminService = new AdminService();
