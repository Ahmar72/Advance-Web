import { createAdminSupabase } from '../../config/supabase';

export interface AnalyticsMetrics {
  summary: {
    total_ads: number;
    published_ads: number;
    pending_ads: number;
    rejected_ads: number;
    expired_ads: number;
  };
  revenue: {
    total_revenue: number;
    verified_payments: number;
    pending_payments: number;
    rejected_payments: number;
    average_order_value: number;
  };
  moderation: {
    total_reviewed: number;
    approval_rate: number;
    rejection_rate: number;
    average_review_time: string;
  };
  taxonomy: {
    top_categories: Array<{ name: string; count: number }>;
    top_cities: Array<{ name: string; count: number }>;
  };
  packages: {
    distribution: Array<{ name: string; count: number }>;
    revenue_by_package: Array<{ name: string; revenue: number }>;
  };
  users: {
    total_users: number;
    active_users: number;
    verified_sellers: number;
  };
}

class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard data
   */
  async getAnalytics(): Promise<AnalyticsMetrics> {
    const supabase = createAdminSupabase();
    try {
      // Fetch all necessary data in parallel
      const [
        adStats,
        paymentStats,
        moderationStats,
        categoryStats,
        cityStats,
        packageStats,
        userStats,
      ] = await Promise.all([
        this.getAdStats(),
        this.getPaymentStats(),
        this.getModerationStats(),
        this.getCategoryStats(),
        this.getCityStats(),
        this.getPackageStats(),
        this.getUserStats(),
      ]);

      return {
        summary: adStats,
        revenue: paymentStats,
        moderation: moderationStats,
        taxonomy: {
          top_categories: categoryStats,
          top_cities: cityStats,
        },
        packages: packageStats,
        users: userStats,
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics: ${error}`);
    }
  }

  private async getAdStats() {
    const supabase = createAdminSupabase();
    const { data: allAds } = await supabase
      .from('ads')
      .select('status', { count: 'exact' });

    const counts = {
      total: 0,
      published: 0,
      under_review: 0,
      rejected: 0,
      expired: 0,
    };

    (allAds || []).forEach((ad: any) => {
      counts.total++;
      if (ad.status === 'published') counts.published++;
      else if (ad.status === 'under_review') counts.under_review++;
      else if (ad.status === 'rejected') counts.rejected++;
      else if (ad.status === 'expired') counts.expired++;
    });

    return {
      total_ads: counts.total,
      published_ads: counts.published,
      pending_ads: counts.under_review,
      rejected_ads: counts.rejected,
      expired_ads: counts.expired,
    };
  }

  private async getPaymentStats() {
    const supabase = createAdminSupabase();
    const { data: payments } = await supabase
      .from('payments')
      .select('status, amount');

    let total = 0;
    let verified = 0;
    let pending = 0;
    let rejected = 0;

    (payments || []).forEach((p: any) => {
      if (p.status === 'verified') {
        total += p.amount;
        verified++;
      } else if (p.status === 'pending') {
        pending++;
      } else if (p.status === 'rejected') {
        rejected++;
      }
    });

    return {
      total_revenue: total,
      verified_payments: verified,
      pending_payments: pending,
      rejected_payments: rejected,
      average_order_value: verified > 0 ? total / verified : 0,
    };
  }

  private async getModerationStats() {
    const supabase = createAdminSupabase();
    const { data: history } = await supabase
      .from('ad_status_history')
      .select('previous_status, new_status, changed_at')
      .eq('previous_status', 'under_review');

    let approved = 0;
    let rejected = 0;

    (history || []).forEach((h: any) => {
      if (h.new_status !== 'rejected' && h.new_status !== 'payment_pending')
        approved++;
      else rejected++;
    });

    const total = approved + rejected;
    const approvalRate =
      total > 0 ? ((approved / total) * 100).toFixed(1) : '0';
    const rejectionRate =
      total > 0 ? ((rejected / total) * 100).toFixed(1) : '0';

    return {
      total_reviewed: total,
      approval_rate: parseFloat(approvalRate),
      rejection_rate: parseFloat(rejectionRate),
      average_review_time: '2-4 hours',
    };
  }

  private async getCategoryStats() {
    const supabase = createAdminSupabase();
    const { data: ads } = await supabase
      .from('ads')
      .select('category:categories(name)');

    const categoryMap: Record<string, number> = {};
    (ads || []).forEach((ad: any) => {
      const name = ad.category?.name || 'Unknown';
      categoryMap[name] = (categoryMap[name] || 0) + 1;
    });

    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private async getCityStats() {
    const supabase = createAdminSupabase();
    const { data: ads } = await supabase
      .from('ads')
      .select('city:cities(name)');

    const cityMap: Record<string, number> = {};
    (ads || []).forEach((ad: any) => {
      const name = ad.city?.name || 'Unknown';
      cityMap[name] = (cityMap[name] || 0) + 1;
    });

    return Object.entries(cityMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private async getPackageStats() {
    const supabase = createAdminSupabase();
    const { data: ads } = await supabase
      .from('ads')
      .select('package:packages(name, price)');

    const packageMap: Record<string, { count: number; revenue: number }> = {};
    (ads || []).forEach((ad: any) => {
      const name = ad.package?.name || 'Unknown';
      const price = ad.package?.price || 0;
      if (!packageMap[name]) {
        packageMap[name] = { count: 0, revenue: 0 };
      }
      packageMap[name].count++;
      packageMap[name].revenue += price;
    });

    const distribution = Object.entries(packageMap).map(([name, data]) => ({
      name,
      count: data.count,
    }));

    const revenue = Object.entries(packageMap).map(([name, data]) => ({
      name,
      revenue: data.revenue,
    }));

    return { distribution, revenue_by_package: revenue };
  }

  private async getUserStats() {
    const supabase = createAdminSupabase();
    const { data: users, count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const { data: verifiedSellers } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('is_verified', true);

    return {
      total_users: totalUsers || 0,
      active_users: (users || []).length,
      verified_sellers: (verifiedSellers || []).length,
    };
  }

  /**
   * Get revenue timeline (for charts)
   */
  async getRevenueTimeline(days: number = 30) {
    const supabase = createAdminSupabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'verified')
      .gte('created_at', startDate.toISOString());

    // Group by date
    const timeline: Record<string, number> = {};
    (payments || []).forEach((p: any) => {
      const date = new Date(p.created_at).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + p.amount;
    });

    return Object.entries(timeline)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get ad status distribution for pie chart
   */
  async getStatusDistribution() {
    const supabase = createAdminSupabase();
    const { data: ads } = await supabase.from('ads').select('status');

    const distribution: Record<string, number> = {};
    (ads || []).forEach((ad: any) => {
      const status = ad.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
    }));
  }
}

export const analyticsService = new AnalyticsService();
