// Types specific to moderation feature
export interface ReviewQueueItem {
  ad_id: string;
  title: string;
  user_email: string;
  status: string;
  created_at: string;
}
