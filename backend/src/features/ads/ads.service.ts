import { createAdminSupabase } from '../../config/supabase';
import { Ad, AdMedia, AdStatusHistory } from '../../shared/types/database.types';
import { 
  CreateAdInput, 
  EditAdInput, 
  SelectPackageInput,
  SubmitPaymentProofInput,
  StatusTransitionInput,
  PublishScheduleInput,
  AdListQuery
} from './ads.schema';
import { AdDetailResponse, AdListResponse } from './ads.types';

class AdsService {
  /**
   * Create a new ad draft for the current user
   */
  async createAd(userId: string, data: CreateAdInput): Promise<Ad> {
    const supabase = createAdminSupabase();
    // Generate slug from title
    const slug = this.generateSlug(data.title);

    // Because package_id is NOT NULL at the DB level, we need a temporary
    // default package for draft ads. This will be overwritten when the
    // user selects a real package in the next step of the wizard.
    let draftPackageId: string | null = null;

    const { data: basicPackage, error: basicError } = await supabase
      .from('packages')
      .select('id')
      .eq('slug', 'basic')
      .single();

    if (!basicError && basicPackage) {
      draftPackageId = basicPackage.id;
    } else {
      const { data: anyPackage } = await supabase
        .from('packages')
        .select('id')
        .eq('is_active', true)
        .order('price')
        .limit(1)
        .single();

      draftPackageId = anyPackage?.id || null;
    }

    if (!draftPackageId) {
      throw new Error(
        'No active packages found. Please run 002_seed_dummy_data.sql in Supabase.'
      );
    }

    // Create the ad record
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        user_id: userId,
        title: data.title,
        slug,
        description: data.description,
        category_id: data.category_id,
        city_id: data.city_id,
        package_id: draftPackageId,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[ADS] Create ad failed:', {
        message: error.message,
        details: error.details,
        code: error.code,
      });
      throw new Error(`Failed to create ad: ${error.message}`);
    }

    // Add media URLs
    const mediaInserts = data.media_urls.map((url) => ({
      ad_id: ad.id,
      original_url: url,
      source_type: this.detectMediaType(url),
      thumbnail_url: this.generateThumbnailUrl(url),
      validation_status: 'pending' as const,
    }));

    const { error: mediaError } = await supabase
      .from('ad_media')
      .insert(mediaInserts);

    if (mediaError) throw new Error(`Failed to add media: ${mediaError.message}`);

    return ad;
  }

  /**
   * Get detailed ad information with relationships
   */
  async getAdById(adId: string): Promise<AdDetailResponse> {
    const supabase = createAdminSupabase();
    const { data: ad, error } = await supabase
      .from('ads')
      .select(
        `
        *,
        media:ad_media(*),
        seller:users!inner(id, email, full_name),
        category:categories(*),
        city:cities(*),
        package:packages(*),
        status_history:ad_status_history(*)
      `
      )
      .eq('id', adId)
      .single();

    if (error) throw new Error(`Ad not found: ${error.message}`);
    return ad;
  }

  /**
   * Get ads with pagination and filters for public browsing
   */
  async listPublicAds(query: AdListQuery): Promise<AdListResponse> {
    const supabase = createAdminSupabase();
    let q = supabase
      .from('ads')
      .select(
        `
        *,
        media:ad_media(*),
        seller:users!inner(id, email, full_name),
        category:categories(*),
        city:cities(*),
        package:packages(*),
        status_history:ad_status_history(*)
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .gt('expire_at', new Date().toISOString()); // Only non-expired ads

    // Apply filters
    if (query.search) {
      q = q.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }
    if (query.category_id) {
      q = q.eq('category_id', query.category_id);
    }
    if (query.city_id) {
      q = q.eq('city_id', query.city_id);
    }

    // Apply sorting
    if (query.sort === 'newest') {
      q = q.order('created_at', { ascending: false });
    } else if (query.sort === 'expiring_soon') {
      q = q.order('expire_at', { ascending: true });
    } else {
      // Default: rank score
      q = q.order('rank_score', { ascending: false });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;
    q = q.range(offset, offset + limit - 1);

    const { data, count, error } = await q;

    if (error) throw new Error(`Failed to list ads: ${error.message}`);

    return {
      data: data as AdDetailResponse[],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get user's own ads (all statuses)
   */
  async getUserAds(userId: string, page = 1, limit = 20): Promise<AdListResponse> {
    const supabase = createAdminSupabase();
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('ads')
      .select(
        `
        *,
        media:ad_media(*),
        category:categories(*),
        city:cities(*),
        package:packages(*),
        status_history:ad_status_history(*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch user ads: ${error.message}`);

    return {
      data: data as AdDetailResponse[],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Update ad (only drafts can be fully edited; published require admin review)
   */
  async updateAd(userId: string, adId: string, data: EditAdInput): Promise<Ad> {
    const supabase = createAdminSupabase();
    // Verify ownership
    const ad = await this.getAdById(adId);
    if (ad.user_id !== userId) throw new Error('Unauthorized to edit this ad');
    if (ad.status !== 'draft') throw new Error('Only draft ads can be edited');

    const updateData: any = {};
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = this.generateSlug(data.title);
    }
    if (data.description) updateData.description = data.description;
    if (data.category_id) updateData.category_id = data.category_id;
    if (data.city_id) updateData.city_id = data.city_id;

    const { data: updated, error } = await supabase
      .from('ads')
      .update(updateData)
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update ad: ${error.message}`);

    // If media URLs changed, update them
    if (data.media_urls) {
      await supabase.from('ad_media').delete().eq('ad_id', adId);

      const mediaInserts = data.media_urls.map((url) => ({
        ad_id: adId,
        original_url: url,
        source_type: this.detectMediaType(url),
        thumbnail_url: this.generateThumbnailUrl(url),
        validation_status: 'pending',
      }));

      await supabase.from('ad_media').insert(mediaInserts);
    }

    return updated;
  }

  /**
   * Delete an ad owned by the current user (drafts only)
   */
  async deleteAd(userId: string, adId: string): Promise<void> {
    const supabase = createAdminSupabase();
    const ad = await this.getAdById(adId);
    if (ad.user_id !== userId) {
      throw new Error('Unauthorized to delete this ad');
    }
    if (ad.status !== 'draft') {
      throw new Error('Only draft ads can be deleted');
    }

    const { error } = await supabase.from('ads').delete().eq('id', adId);
    if (error) {
      throw new Error(`Failed to delete ad: ${error.message}`);
    }
  }

  /**
   * Select package for an ad (transitions from draft to under_review)
   */
  async selectPackageAndSubmit(userId: string, adId: string, input: SelectPackageInput): Promise<Ad> {
    const supabase = createAdminSupabase();
    // Verify ownership and status
    const ad = await this.getAdById(adId);
    if (ad.user_id !== userId) throw new Error('Unauthorized');
    if (ad.status !== 'draft') throw new Error('Only draft ads can select packages');

    // Verify package exists
    const { data: pkg } = await supabase
      .from('packages')
      .select('*')
      .eq('id', input.package_id)
      .single();

    if (!pkg) throw new Error('Package not found');

    // Update ad with package and move to under_review
    const { data: updated, error } = await supabase
      .from('ads')
      .update({ package_id: input.package_id, status: 'under_review' })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to select package: ${error.message}`);

    // Log status change
    await this.logStatusHistory(adId, 'draft', 'under_review', userId, 'Package selected and ad submitted');

    return updated;
  }

  /**
   * Submit payment proof (moves ad to payment_submitted status)
   */
  async submitPaymentProof(userId: string, adId: string, input: SubmitPaymentProofInput): Promise<any> {
    const supabase = createAdminSupabase();
    const ad = await this.getAdById(adId);
    if (ad.user_id !== userId) throw new Error('Unauthorized');
    if (ad.status !== 'payment_pending') throw new Error('Ad is not in payment_pending status');

    // Check for duplicate transaction references
    const { data: existing } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_ref', input.transaction_ref)
      .single();

    if (existing) throw new Error('Duplicate transaction reference detected');

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        ad_id: adId,
        user_id: userId,
        amount: input.amount,
        method: input.method,
        transaction_ref: input.transaction_ref,
        sender_name: input.sender_name,
        screenshot_url: input.screenshot_url,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to submit payment: ${error.message}`);

    // Update ad status
    const { error: adError } = await supabase
      .from('ads')
      .update({ status: 'payment_submitted' })
      .eq('id', adId);

    if (adError) throw new Error('Failed to update ad status');

    // Log status change
    await this.logStatusHistory(adId, 'payment_pending', 'payment_submitted', userId, 'Payment proof submitted');

    return payment;
  }

  /**
   * Transition ad status (used by moderators and admins)
   */
  async transitionStatus(adId: string, actorId: string, input: StatusTransitionInput): Promise<Ad> {
    const supabase = createAdminSupabase();
    const ad = await this.getAdById(adId);

    // Validate status transition logic
    this.validateStatusTransition(ad.status, input.new_status);

    const { data: updated, error } = await supabase
      .from('ads')
      .update({ status: input.new_status })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update status: ${error.message}`);

    // Log status change
    await this.logStatusHistory(adId, ad.status, input.new_status, actorId, input.note || input.reason || null);

    return updated;
  }

  /**
   * Schedule publishing for an ad (admin only)
   */
  async schedulePublishing(adId: string, input: PublishScheduleInput): Promise<Ad> {
    const supabase = createAdminSupabase();
    const ad = await this.getAdById(adId);
    if (ad.status !== 'payment_verified') {
      throw new Error('Only payment_verified ads can be scheduled');
    }

    const publishDate = new Date(input.publish_at);
    const expireDate = new Date(publishDate);
    
    // Get package duration
    const pkg = await supabase
      .from('packages')
      .select('duration_days')
      .eq('id', ad.package_id)
      .single();

    if (pkg.data) {
      expireDate.setDate(expireDate.getDate() + pkg.data.duration_days);
    }

    const { data: updated, error } = await supabase
      .from('ads')
      .update({
        status: 'scheduled',
        publish_at: publishDate.toISOString(),
        expire_at: expireDate.toISOString(),
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to schedule: ${error.message}`);

    return updated;
  }

  /**
   * Automatically publish scheduled ads (cron job)
   */
  async publishScheduledAds(): Promise<number> {
    const supabase = createAdminSupabase();
    const now = new Date().toISOString();

    const { data: scheduled, error: fetchError } = await supabase
      .from('ads')
      .select('id')
      .eq('status', 'scheduled')
      .lte('publish_at', now);

    if (fetchError) throw new Error(`Failed to fetch scheduled ads: ${fetchError.message}`);

    if (!scheduled || scheduled.length === 0) return 0;

    // Calculate rank score for newly published ads
    const updateData = scheduled.map((ad) => ({
      id: ad.id,
      status: 'published',
      rank_score: this.calculateRankScore(true),
    }));

    const { error: updateError } = await supabase
      .from('ads')
      .upsert(updateData);

    if (updateError) throw new Error(`Failed to publish ads: ${updateError.message}`);

    // Log status changes
    for (const ad of scheduled) {
      await this.logStatusHistory(ad.id, 'scheduled', 'published', null, 'Auto-published by scheduler');
    }

    return scheduled.length;
  }

  /**
   * Expire old ads (cron job)
   */
  async expireOldAds(): Promise<number> {
    const supabase = createAdminSupabase();
    const now = new Date().toISOString();

    const { data: expired, error: fetchError } = await supabase
      .from('ads')
      .select('id')
      .eq('status', 'published')
      .lte('expire_at', now);

    if (fetchError) throw new Error(`Failed to fetch expired ads: ${fetchError.message}`);

    if (!expired || expired.length === 0) return 0;

    const { error: updateError } = await supabase
      .from('ads')
      .update({ status: 'expired' })
      .in('id', expired.map((ad) => ad.id));

    if (updateError) throw new Error(`Failed to expire ads: ${updateError.message}`);

    // Log status changes
    for (const ad of expired) {
      await this.logStatusHistory(ad.id, 'published', 'expired', null, 'Auto-expired by scheduler');
    }

    return expired.length;
  }

  // HELPER METHODS

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private detectMediaType(url: string): 'image' | 'youtube' | 'external' {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
    return 'external';
  }

  private generateThumbnailUrl(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Extract video ID and generate thumbnail
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    return url; // Return original URL if not YouTube or not image
  }

  private calculateRankScore(isFeatured = false, packageWeight = 1, daysOld = 0): number {
    let score = 0;
    if (isFeatured) score += 50;
    score += packageWeight * 10;
    // Freshness: highest in first 7 days, decays after
    const freshnessPoints = Math.max(0, 20 - daysOld * 2);
    score += freshnessPoints;
    return score;
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      draft: ['under_review'],
      under_review: ['payment_pending', 'rejected'],
      payment_pending: ['payment_submitted', 'rejected'],
      payment_submitted: ['payment_verified', 'rejected'],
      payment_verified: ['scheduled', 'published', 'rejected'],
      scheduled: ['published', 'rejected'],
      published: ['expired', 'archived', 'rejected'],
      expired: ['archived', 'renewed'],
      rejected: ['draft'],
      archived: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async logStatusHistory(
    adId: string,
    previousStatus: string,
    newStatus: string,
    changedBy: string | null,
    note: string | null
  ): Promise<void> {
    const supabase = createAdminSupabase();
    await supabase.from('ad_status_history').insert({
      ad_id: adId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: changedBy,
      note,
      changed_at: new Date().toISOString(),
    });
  }
}

export const adsService = new AdsService();
