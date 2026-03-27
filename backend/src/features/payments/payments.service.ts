import { createAdminSupabase } from '../../config/supabase';
import { Payment } from '../../shared/types/database.types';
import { VerifyPaymentInput } from './payments.schema';
import { adminService } from '../admin/admin.service';

class PaymentsService {
  /**
   * Get payment queue (pending payments for admin review)
   */
  async getPaymentQueue(page = 1, limit = 20): Promise<any> {
    const supabase = createAdminSupabase();
    const offset = (page - 1) * limit;

    // First, fetch pending payments only. We'll manually attach related
    // ad and user details to avoid complex joined selects that can
    // cause PostgREST errors if relationships are not inferred.
    const { data: payments, count, error } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch payment queue: ${error.message}`);
    }

    if (!payments || payments.length === 0) {
      return {
        data: [],
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      };
    }

    // Collect unique ad and user IDs referenced by these payments
    const adIds = Array.from(
      new Set(
        payments
          .map((p: any) => p.ad_id)
          .filter((id: string | null | undefined) => !!id)
      )
    );
    const userIds = Array.from(
      new Set(
        payments
          .map((p: any) => p.user_id)
          .filter((id: string | null | undefined) => !!id)
      )
    );

    // Fetch related ads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('id, title, slug, user_id')
      .in('id', adIds);

    if (adsError) {
      throw new Error(`Failed to fetch related ads for payments: ${adsError.message}`);
    }

    // Fetch related users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    if (usersError) {
      throw new Error(`Failed to fetch related users for payments: ${usersError.message}`);
    }

    const adsById = new Map<string, any>((ads || []).map((a: any) => [a.id, a]));
    const usersById = new Map<string, any>((users || []).map((u: any) => [u.id, u]));

    const enrichedPayments = payments.map((p: any) => ({
      ...p,
      ad: adsById.get(p.ad_id) || null,
      user: usersById.get(p.user_id) || null,
    }));

    return {
      data: enrichedPayments,
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get single payment details
   */
  async getPaymentById(paymentId: string): Promise<any> {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        ad:ads(id, title, slug, user_id),
        user:users(id, email, full_name)
      `
      )
      .eq('id', paymentId)
      .single();

    if (error) throw new Error('Payment not found');
    return data;
  }

  /**
   * Verify or reject payment (admin)
   */
  async verifyPayment(
    adminId: string,
    input: VerifyPaymentInput
  ): Promise<Payment> {
    const supabase = createAdminSupabase();
    const payment = await this.getPaymentById(input.payment_id);

    if (input.verified) {
      // Approve: mark payment verified and publish ad automatically
      const { data: updated, error } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', input.payment_id)
        .select()
        .single();

      if (error) throw new Error('Failed to verify payment');

      // Update ad status to payment_verified
      await supabase
        .from('ads')
        .update({ status: 'payment_verified' })
        .eq('id', payment.ad_id);

      // Log status change
      await supabase.from('ad_status_history').insert({
        ad_id: payment.ad_id,
        previous_status: 'payment_submitted',
        new_status: 'payment_verified',
        changed_by: adminId,
        note: 'Payment verified by admin',
        changed_at: new Date().toISOString(),
      });

      // Automatically publish the ad using admin publish logic
      // This will set publish_at / expire_at based on the package
      await adminService.publishAd(payment.ad_id);

      return updated;
    } else {
      // Reject: move ad to payment_pending with reason
      const { data: updated, error } = await supabase
        .from('payments')
        .update({
          status: 'rejected',
          rejection_reason: input.rejection_reason,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', input.payment_id)
        .select()
        .single();

      if (error) throw new Error('Failed to reject payment');

      // Update ad status back to payment_pending
      await supabase
        .from('ads')
        .update({ status: 'payment_pending' })
        .eq('id', payment.ad_id);

      // Log status change
      await supabase.from('ad_status_history').insert({
        ad_id: payment.ad_id,
        previous_status: 'payment_submitted',
        new_status: 'payment_pending',
        changed_by: adminId,
        note: `Payment rejected: ${input.rejection_reason}`,
        changed_at: new Date().toISOString(),
      });

      return updated;
    }
  }
}

export const paymentsService = new PaymentsService();
