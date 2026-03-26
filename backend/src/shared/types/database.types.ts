// Shared database types for the entire application

export type AdStatus = 
  | 'draft'
  | 'under_review'
  | 'payment_pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'scheduled'
  | 'published'
  | 'expired'
  | 'rejected'
  | 'archived';

export type UserRole = 'client' | 'moderator' | 'admin' | 'super_admin';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type PaymentMethod = 'bank_transfer' | 'card' | 'mobile_wallet' | 'cash';

export type MediaSourceType = 'image' | 'youtube' | 'external';

export type MediaValidationStatus = 'pending' | 'valid' | 'invalid';

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'reminder';

export type UserStatus = 'active' | 'suspended' | 'deleted';

export type SystemHealthStatus = 'ok' | 'warning' | 'error';

// Database Models
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  phone: string | null;
  city: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  price: number;
  refresh_rule: 'none' | 'manual' | 'auto';
  refresh_interval_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  user_id: string;
  package_id: string;
  category_id: string;
  city_id: string;
  title: string;
  slug: string;
  description: string;
  status: AdStatus;
  publish_at: string | null;
  expire_at: string | null;
  rank_score: number;
  is_featured: boolean;
  admin_boost: number;
  created_at: string;
  updated_at: string;
}

export interface AdMedia {
  id: string;
  ad_id: string;
  source_type: MediaSourceType;
  original_url: string;
  thumbnail_url: string | null;
  validation_status: MediaValidationStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  ad_id: string;
  user_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string | null;
  status: PaymentStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action_type: string;
  target_type: string;
  target_id: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  created_at: string;
}

export interface AdStatusHistory {
  id: string;
  ad_id: string;
  previous_status: AdStatus;
  new_status: AdStatus;
  changed_by: string | null;
  note: string | null;
  changed_at: string;
}

export interface LearningQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string | null;
  difficulty: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemHealthLog {
  id: string;
  check_type: string;
  status: SystemHealthStatus;
  details: Record<string, any> | null;
  checked_at: string;
}
