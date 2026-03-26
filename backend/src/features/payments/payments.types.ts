// Types specific to Payments feature
export interface PaymentQueueItem {
  payment_id: string;
  ad_id: string;
  ad_title: string;
  user_email: string;
  amount: number;
  method: string;
  created_at: string;
}
