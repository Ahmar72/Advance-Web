-- ADFLOW PRO DATABASE SCHEMA
-- Core tables for the classified ads workflow platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'moderator', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SELLER PROFILES
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  phone TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CITIES
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PACKAGES
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  duration_days INT NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  is_featured BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2) NOT NULL,
  refresh_rule TEXT DEFAULT 'none' CHECK (refresh_rule IN ('none', 'manual', 'auto')),
  refresh_interval_days INT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ADS (Main listing record)
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  city_id UUID NOT NULL REFERENCES cities(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'under_review', 'payment_pending', 'payment_submitted', 
    'payment_verified', 'scheduled', 'published', 'expired', 'rejected', 'archived'
  )),
  publish_at TIMESTAMP,
  expire_at TIMESTAMP,
  rank_score FLOAT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  admin_boost FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AD MEDIA (External URLs only)
CREATE TABLE IF NOT EXISTS ad_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('image', 'youtube', 'external')),
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL UNIQUE REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'card', 'mobile_wallet', 'cash')),
  transaction_ref TEXT NOT NULL UNIQUE,
  sender_name TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AD STATUS HISTORY
CREATE TABLE IF NOT EXISTS ad_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  note TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- LEARNING QUESTIONS (Demo content)
CREATE TABLE IF NOT EXISTS learning_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SYSTEM HEALTH LOGS
CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'warning', 'error')),
  details JSONB,
  checked_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES for Performance
DROP INDEX IF EXISTS idx_users_role;
CREATE INDEX idx_users_role ON users(role);

DROP INDEX IF EXISTS idx_ads_user_id;
CREATE INDEX idx_ads_user_id ON ads(user_id);

DROP INDEX IF EXISTS idx_ads_status;
CREATE INDEX idx_ads_status ON ads(status);

DROP INDEX IF EXISTS idx_ads_status_publish_at;
CREATE INDEX idx_ads_status_publish_at ON ads(status, publish_at);

DROP INDEX IF EXISTS idx_ads_status_expire_at;
CREATE INDEX idx_ads_status_expire_at ON ads(status, expire_at);

DROP INDEX IF EXISTS idx_ads_rank_score;
CREATE INDEX idx_ads_rank_score ON ads(rank_score DESC);

DROP INDEX IF EXISTS idx_payments_status;
CREATE INDEX idx_payments_status ON payments(status);

DROP INDEX IF EXISTS idx_notifications_user_id;
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

DROP INDEX IF EXISTS idx_categories_active;
CREATE INDEX idx_categories_active ON categories(is_active);

DROP INDEX IF EXISTS idx_cities_active;
CREATE INDEX idx_cities_active ON cities(is_active);

DROP INDEX IF EXISTS idx_packages_active;
CREATE INDEX idx_packages_active ON packages(is_active);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
CREATE POLICY "Users can read all profiles" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read published ads" ON ads;
CREATE POLICY "Users can read published ads" ON ads FOR SELECT USING (status = 'published' AND expire_at > NOW());

DROP POLICY IF EXISTS "Users can manage own ads" ON ads;
CREATE POLICY "Users can manage own ads" ON ads FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own payments" ON payments;
CREATE POLICY "Users can read own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
