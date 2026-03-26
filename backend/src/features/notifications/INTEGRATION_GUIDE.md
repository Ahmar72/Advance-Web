/**
 * Email Notification Integration Points
 * 
 * This file shows where to add email notifications in existing services.
 * These are code snippets that should be integrated into the mentioned service files.
 * 
 * Import at top of each service:
 * import { notificationService } from '../notifications/notifications.service';
 */

// ============================================================================
// MODERATION SERVICE INTEGRATION
// In features/moderation/moderation.service.ts
// ============================================================================
// 
// When an ad is APPROVED:
// 
// async reviewAd(adId: string, approved: boolean, rejectionReason?: string) {
//   // ... existing logic ...
// 
//   if (approved) {
//     // Existing ad status update to 'payment_pending'
//     
//     // NEW: Send approval email
//     const ad = await supabase.from('ads').select('*').eq('id', adId).single();
//     const user = await supabase.from('users').select('*').eq('id', ad.user_id).single();
//     
//     await notificationService.notifyAdApproved(
//       user.email,
//       ad.title,
//       `${process.env.FRONTEND_URL}/dashboard`
//     );
//   } else {
//     // Existing ad status update to 'rejected'
//     
//     // NEW: Send rejection email
//     const ad = await supabase.from('ads').select('*').eq('id', adId).single();
//     const user = await supabase.from('users').select('*').eq('id', ad.user_id).single();
//     
//     await notificationService.notifyAdRejected(
//       user.email,
//       ad.title,
//       rejectionReason || 'Does not meet posting guidelines',
//       `${process.env.FRONTEND_URL}/dashboard`
//     );
//   }
// }

// ============================================================================
// PAYMENTS SERVICE INTEGRATION
// In features/payments/payments.service.ts
// ============================================================================
// 
// When a payment is VERIFIED:
// 
// async verifyPayment(paymentId: string) {
//   // ... existing logic ...
//   
//   // NEW: Send payment verification email
//   const payment = await supabase.from('payments').select('*').eq('id', paymentId).single();
//   const ad = await supabase.from('ads').select('*').eq('id', payment.ad_id).single();
//   const user = await supabase.from('users').select('*').eq('id', ad.user_id).single();
//   
//   await notificationService.notifyPaymentVerified(
//     user.email,
//     ad.title,
//     new Date(ad.expire_at).toLocaleDateString(),
//     `${process.env.FRONTEND_URL}/ads/${ad.id}`
//   );
// }
// 
// When a payment is REJECTED:
// 
// async rejectPayment(paymentId: string, reason: string) {
//   // ... existing logic ...
//   
//   // NEW: Send payment rejection email
//   const payment = await supabase.from('payments').select('*').eq('id', paymentId).single();
//   const ad = await supabase.from('ads').select('*').eq('id', payment.ad_id).single();
//   const user = await supabase.from('users').select('*').eq('id', ad.user_id).single();
//   
//   await notificationService.notifyPaymentRejected(
//     user.email,
//     ad.title,
//     reason,
//     `${process.env.FRONTEND_URL}/dashboard`
//   );
// }

// ============================================================================
// CRON SERVICE INTEGRATION
// In shared/cron/jobs.ts
// ============================================================================
// 
// For expiring listings (sendExpiringNotifications):
// 
// export async function sendExpiringNotifications() {
//   const expiringAds = await supabase
//     .from('ads')
//     .select('id, title, expire_at, user_id, users(email)')
//     .eq('status', 'published')
//     .lte('expire_at', threeDaysFromNow);
//   
//   for (const ad of expiringAds.data || []) {
//     const daysLeft = Math.ceil(
//       (new Date(ad.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
//     );
//     
//     // NEW: Send expiring notification email
//     await notificationService.notifyExpiringListing(
//       ad.users.email,
//       ad.title,
//       daysLeft,
//       new Date(ad.expire_at).toLocaleDateString(),
//       `${process.env.FRONTEND_URL}/dashboard`
//     );
//   }
// }

// ============================================================================
// AUTH SERVICE INTEGRATION
// In features/auth/auth.service.ts (if exists)
// ============================================================================
// 
// When a new account is CREATED:
// 
// async signUp(email: string, password: string, fullName: string) {
//   // ... existing sign-up logic ...
//   
//   // NEW: Send welcome email
//   await notificationService.notifyWelcome(
//     email,
//     fullName,
//     `${process.env.FRONTEND_URL}/create-ad`
//   );
// }

// ============================================================================
// CONFIGURATION REQUIRED
// ============================================================================
// 
// Add these environment variables to your backend .env:
// 
// SENDGRID_API_KEY=your_sendgrid_api_key_here
// SENDGRID_FROM_EMAIL=noreply@adflowpro.com
// FRONTEND_URL=https://your-frontend-domain.com
// 
// Install SendGrid dependency:
// npm install @sendgrid/mail
// 
// Or if testing locally, emails are logged to console (no API key needed)

// ============================================================================
// TESTING
// ============================================================================
// 
// To test without SendGrid:
// 1. Don't set SENDGRID_API_KEY in .env
// 2. Trigger notification events (approve ad, verify payment, etc.)
// 3. Check console logs for email content that would be sent
// 
// To test with SendGrid:
// 1. Get API key from SendGrid console
// 2. Add SENDGRID_API_KEY to .env
// 3. Add test email to SENDGRID_FROM_EMAIL if needed
// 4. Trigger notification events
// 5. Check inbox for emails

export const NOTIFICATION_SETUP_COMPLETE = true;
