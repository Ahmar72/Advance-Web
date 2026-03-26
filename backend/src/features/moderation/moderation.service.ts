import { createAdminSupabase } from '../../config/supabase';
import { ReviewAdInput } from './moderation.schema';

class ModerationService {
  /**
   * Get moderation queue (ads under review)
   */
  async getReviewQueue(page = 1, limit = 20): Promise<any> {
    const supabase = createAdminSupabase();
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('ads')
      .select(
        `
        *,
        media:ad_media(*),
        user:users(id, email, full_name),
        category:categories(*),
        city:cities(*)
      `,
        { count: 'exact' }
      )
      .eq('status', 'under_review')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch review queue: ${error.message}`);

    return {
      data,
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Review an ad (approve or reject)
   */
  async reviewAd(
    moderatorId: string,
    adId: string,
    input: ReviewAdInput
  ): Promise<any> {
    const supabase = createAdminSupabase();
    const newStatus = input.approved ? 'payment_pending' : 'rejected';

    const { data: updated, error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw new Error(`Failed to review ad: ${error.message}`);

    // Log status change
    await supabase.from('ad_status_history').insert({
      ad_id: adId,
      previous_status: 'under_review',
      new_status: newStatus,
      changed_by: moderatorId,
      note: input.rejection_reason || null
        ? `Rejected: ${input.rejection_reason}`
        : input.internal_note,
      changed_at: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Flag content as suspicious
   */
  async flagContent(adId: string, flagReason: string, severity: string): Promise<void> {
    const supabase = createAdminSupabase();
    await supabase.from('audit_logs').insert({
      action_type: 'content_flagged',
      target_type: 'ad',
      target_id: adId,
      new_value: { reason: flagReason, severity },
      created_at: new Date().toISOString(),
    });
  }
}

export const moderationService = new ModerationService();
