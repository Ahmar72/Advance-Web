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

    const { data, count, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        ad:ads(id, title, slug, user_id),
        user:users(id, email, full_name)
      `,
        { count: 'exact' }
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch payment queue: ${error.message}`);

    return {
      data,
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
