/**
 * Cron Job Handlers for AdFlow Pro
 * These should be called by scheduled services (e.g., GitHub Actions, Vercel cron, node-cron)
 */

import { adsService } from '../../features/ads/ads.service';
import { createAdminSupabase } from '../../config/supabase';

export class CronJobs {
  /**
   * Publish all scheduled ads that are due
   * Call this hourly or every 30 minutes
   */
  static async publishScheduledAds(): Promise<{ success: number; failed: number }> {
    const supabase = createAdminSupabase();
    try {
      const count = await adsService.publishScheduledAds();
      console.log(`✅ Published ${count} scheduled ads`);

      // Log to system health
      await supabase.from('system_health_logs').insert({
        check_type: 'cron_publish',
        status: 'ok',
        details: { published_count: count },
        checked_at: new Date().toISOString(),
      });

      return { success: count, failed: 0 };
    } catch (error: any) {
      console.error('❌ Failed to publish scheduled ads:', error);
      await supabase.from('system_health_logs').insert({
        check_type: 'cron_publish',
        status: 'error',
        details: { error: error.message },
        checked_at: new Date().toISOString(),
      });
      return { success: 0, failed: 1 };
    }
  }

  /**
   * Expire outdated ads
   * Call this daily
   */
  static async expireOutdatedAds(): Promise<{ success: number; failed: number }> {
    const supabase = createAdminSupabase();
    try {
      const count = await adsService.expireOldAds();
      console.log(`✅ Expired ${count} ads`);

      await supabase.from('system_health_logs').insert({
        check_type: 'cron_expire',
        status: 'ok',
        details: { expired_count: count },
        checked_at: new Date().toISOString(),
      });

      return { success: count, failed: 0 };
    } catch (error: any) {
      console.error('❌ Failed to expire ads:', error);
      await supabase.from('system_health_logs').insert({
        check_type: 'cron_expire',
        status: 'error',
        details: { error: error.message },
        checked_at: new Date().toISOString(),
      });
      return { success: 0, failed: 1 };
    }
  }

  /**
   * Send expiring-soon notifications
   * Call this daily
   */
  static async sendExpiringNotifications(): Promise<void> {
    const supabase = createAdminSupabase();
    try {
      const now = new Date();
      const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // Get ads expiring within 48 hours
      const { data: expiringAds } = await supabase
        .from('ads')
        .select('id, user_id, title, expire_at')
        .eq('status', 'published')
        .gte('expire_at', now.toISOString())
        .lte('expire_at', fortyEightHoursLater.toISOString());

      if (!expiringAds || expiringAds.length === 0) {
        console.log('No ads expiring soon');
        return;
      }

      // Create notifications for each user
      const notifications = expiringAds.map((ad: any) => ({
        user_id: ad.user_id,
        title: 'Ad Expiring Soon',
        message: `Your ad "${ad.title}" will expire at ${new Date(ad.expire_at).toLocaleDateString()}`,
        type: 'reminder',
        link: `/ads/${ad.id}`,
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`✅ Sent ${expiringAds.length} expiring notifications`);
    } catch (error) {
      console.error('❌ Failed to send notifications:', error);
    }
  }

  /**
   * Database heartbeat check
   * Call this hourly to verify system health
   */
  static async databaseHeartbeat(): Promise<void> {
    const supabase = createAdminSupabase();
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('count', { count: 'exact' });

      if (error) {
        await supabase.from('system_health_logs').insert({
          check_type: 'db_heartbeat',
          status: 'error',
          details: { error: error.message },
          checked_at: new Date().toISOString(),
        });
        console.error('❌ Database check failed:', error);
        return;
      }

      await supabase.from('system_health_logs').insert({
        check_type: 'db_heartbeat',
        status: 'ok',
        details: { record_count: data },
        checked_at: new Date().toISOString(),
      });

      console.log('✅ Database heartbeat OK');
    } catch (error) {
      console.error('❌ Heartbeat check failed:', error);
    }
  }
}

/**
 * Cron Endpoints
 * These should be protected with API keys in production
 */
export const cronEndpoints = {
  publishScheduled: async (): Promise<any> => {
    return await CronJobs.publishScheduledAds();
  },
  expireAds: async (): Promise<any> => {
    return await CronJobs.expireOutdatedAds();
  },
  sendNotifications: async (): Promise<any> => {
    await CronJobs.sendExpiringNotifications();
    return { success: true };
  },
  healthCheck: async (): Promise<any> => {
    await CronJobs.databaseHeartbeat();
    return { success: true };
  },
};
