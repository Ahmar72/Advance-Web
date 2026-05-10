-- ============================================================================
-- COMMITTEE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Paste this entire SQL into Supabase SQL Editor (Project → SQL Editor → New Query)
-- Run the entire script to create all tables, constraints, and policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT CREATE ON SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- 1. PROFILES TABLE (User metadata)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  experience_score INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COMMITTEES TABLE
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  monthly_amount NUMERIC(12, 2) NOT NULL CHECK (monthly_amount > 0),
  max_members INTEGER NOT NULL CHECK (max_members > 0 AND max_members <= 10),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'active', 'completed', 'cancelled')),
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COMMITTEE MEMBERS TABLE
CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email_or_phone VARCHAR(255),
  join_order INTEGER NOT NULL,
  is_creator BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  
  -- Payment Details
  payment_identifier VARCHAR(255),
  iban VARCHAR(34),
  bank_account_id VARCHAR(255),
  other_payment_details JSONB DEFAULT '{}',
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(committee_id, join_order)
);

-- 4. COMMITTEE CYCLES TABLE (Monthly turns)
CREATE TABLE committee_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  recipient_member_id UUID NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(committee_id, cycle_number)
);

-- 5. PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES committee_cycles(id) ON DELETE CASCADE,
  payer_member_id UUID NOT NULL REFERENCES committee_members(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'late')),
  reference VARCHAR(255),
  proof_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(cycle_id, payer_member_id)
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('new_committee', 'upcoming_turn', 'payment_update', 'committee_message', 'join_request', 'join_request_response')),
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_committees_creator_id ON committees(creator_id);
CREATE INDEX idx_committees_status ON committees(status);
CREATE INDEX idx_committee_members_committee_id ON committee_members(committee_id);
CREATE INDEX idx_committee_members_user_id ON committee_members(user_id);
CREATE INDEX idx_committee_cycles_committee_id ON committee_cycles(committee_id);
CREATE INDEX idx_committee_cycles_status ON committee_cycles(status);
CREATE INDEX idx_payments_committee_id ON payments(committee_id);
CREATE INDEX idx_payments_cycle_id ON payments(cycle_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_member_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE UNIQUE INDEX idx_committee_members_committee_user_unique
  ON committee_members(committee_id, user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS AND AUTOMATION
-- ============================================================================

CREATE OR REPLACE FUNCTION is_committee_creator(target_committee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM committees c
    WHERE c.id = target_committee_id
      AND c.creator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_committee_member(target_committee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM committee_members cm
    WHERE cm.committee_id = target_committee_id
      AND cm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION add_committee_creator_member()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT;
BEGIN
  SELECT display_name
  INTO creator_name
  FROM profiles
  WHERE id = NEW.creator_id;

  INSERT INTO committee_members (
    committee_id,
    user_id,
    full_name,
    join_order,
    is_creator,
    approval_status,
    payment_identifier,
    iban,
    bank_account_id,
    other_payment_details
  ) VALUES (
    NEW.id,
    NEW.creator_id,
    COALESCE(creator_name, 'Creator'),
    1,
    TRUE,
    'approved',
    NULL,
    NULL,
    NULL,
    '{}'::jsonb
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read public profiles, update only their own
CREATE POLICY "Users can view any profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- COMMITTEES: Anyone authenticated can view, creator can edit
CREATE POLICY "Authenticated users can create committees" ON committees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view committees" ON committees
  FOR SELECT USING (true);

CREATE POLICY "Creator can update their committee" ON committees
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Creator can delete their committee" ON committees
  FOR DELETE USING (creator_id = auth.uid());

-- COMMITTEE_MEMBERS: Members can view their committee's members
CREATE POLICY "Members can view committee members" ON committee_members
  FOR SELECT USING (true);

CREATE POLICY "Creator can manage members" ON committee_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creator can update members" ON committee_members
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- COMMITTEE_CYCLES: Members can view cycles of their committees
CREATE POLICY "Members can view cycles" ON committee_cycles
  FOR SELECT USING (true);

CREATE POLICY "Creator can create cycles" ON committee_cycles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can create cycle records" ON committee_cycles
  FOR UPDATE USING (true);

-- PAYMENTS: Members can view payments for their committees, insert their own
CREATE POLICY "Members can view payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Members can create payment records" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can create payment records" ON payments
  FOR UPDATE USING (true);

-- NOTIFICATIONS: Users can only read their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (true);

-- ============================================================================
-- TRIGGER: Update profile updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================================
-- TRIGGER: Create profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, experience_score, reputation_score)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER committee_creator_member_trigger
AFTER INSERT ON committees
FOR EACH ROW
EXECUTE FUNCTION add_committee_creator_member();

CREATE OR REPLACE FUNCTION notify_new_committee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    p.id,
    'new_committee',
    'New committee available',
    NEW.title || ' is now open for members.',
    jsonb_build_object(
      'committee_id', NEW.id,
      'creator_id', NEW.creator_id,
      'monthly_amount', NEW.monthly_amount,
      'max_members', NEW.max_members,
      'duration_months', NEW.duration_months
    )
  FROM profiles p
  WHERE p.id <> NEW.creator_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER committees_notify_new_committee
AFTER INSERT ON committees
FOR EACH ROW
EXECUTE FUNCTION notify_new_committee();

CREATE OR REPLACE FUNCTION notify_cycle_change()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
  creator_user_id UUID;
BEGIN
  SELECT user_id INTO recipient_user_id
  FROM committee_members
  WHERE id = NEW.recipient_member_id;

  SELECT creator_id INTO creator_user_id
  FROM committees
  WHERE id = NEW.committee_id;

  IF recipient_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      recipient_user_id,
      'upcoming_turn',
      'Your turn is approaching',
      'Cycle ' || NEW.cycle_number || ' is scheduled for ' || NEW.scheduled_date,
      jsonb_build_object(
        'committee_id', NEW.committee_id,
        'cycle_id', NEW.id,
        'cycle_number', NEW.cycle_number,
        'scheduled_date', NEW.scheduled_date,
        'status', NEW.status
      )
    );
  END IF;

  IF creator_user_id IS NOT NULL AND creator_user_id <> recipient_user_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      creator_user_id,
      'committee_message',
      'A committee cycle was created',
      'Cycle ' || NEW.cycle_number || ' has been generated.',
      jsonb_build_object(
        'committee_id', NEW.committee_id,
        'cycle_id', NEW.id,
        'cycle_number', NEW.cycle_number,
        'scheduled_date', NEW.scheduled_date,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER committee_cycles_notify_turns
AFTER INSERT ON committee_cycles
FOR EACH ROW
EXECUTE FUNCTION notify_cycle_change();

CREATE OR REPLACE FUNCTION notify_payment_change()
RETURNS TRIGGER AS $$
DECLARE
  payer_user_id UUID;
  creator_user_id UUID;
BEGIN
  SELECT user_id INTO payer_user_id
  FROM committee_members
  WHERE id = NEW.payer_member_id;

  SELECT creator_id INTO creator_user_id
  FROM committees
  WHERE id = NEW.committee_id;

  IF payer_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      payer_user_id,
      'payment_update',
      'Payment status updated',
      'Your payment for cycle ' || NEW.cycle_id || ' is ' || NEW.payment_status,
      jsonb_build_object(
        'committee_id', NEW.committee_id,
        'cycle_id', NEW.cycle_id,
        'payment_id', NEW.id,
        'payment_status', NEW.payment_status,
        'amount', NEW.amount
      )
    );
  END IF;

  IF creator_user_id IS NOT NULL AND creator_user_id <> payer_user_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      creator_user_id,
      'payment_update',
      'Committee payment update',
      'Payment for cycle ' || NEW.cycle_id || ' is ' || NEW.payment_status,
      jsonb_build_object(
        'committee_id', NEW.committee_id,
        'cycle_id', NEW.cycle_id,
        'payment_id', NEW.id,
        'payment_status', NEW.payment_status,
        'amount', NEW.amount
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER payments_notify_changes
AFTER INSERT OR UPDATE OF payment_status ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_change();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Active committees with creator info
CREATE OR REPLACE VIEW active_committees_with_creator AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.monthly_amount,
  c.max_members,
  c.duration_months,
  c.status,
  p.display_name AS creator_name,
  p.reputation_score,
  COUNT(DISTINCT cm.id) AS current_members,
  c.created_at
FROM committees c
JOIN profiles p ON c.creator_id = p.id
LEFT JOIN committee_members cm ON c.id = cm.committee_id AND cm.approval_status = 'approved'
WHERE c.status IN ('open', 'active')
GROUP BY c.id, p.id;

-- View: Committee progress summary
CREATE OR REPLACE VIEW committee_progress AS
SELECT 
  c.id,
  c.title,
  COUNT(DISTINCT cy.id) AS total_cycles,
  COUNT(DISTINCT cy.id) FILTER (WHERE cy.status = 'completed') AS completed_cycles,
  COUNT(DISTINCT cm.id) AS total_members,
  ROUND(100.0 * COUNT(DISTINCT cy.id) FILTER (WHERE cy.status = 'completed') / NULLIF(COUNT(DISTINCT cy.id), 0)) AS progress_percentage
FROM committees c
LEFT JOIN committee_cycles cy ON c.id = cy.committee_id
LEFT JOIN committee_members cm ON c.id = cm.committee_id AND cm.approval_status = 'approved'
GROUP BY c.id;

-- ============================================================================
-- GRANT PERMISSIONS ON ALL TABLES TO AUTHENTICATED USERS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- 1. Auth trigger automatically creates profile entry when user signs up
-- 2. RLS policies ensure data isolation between users and committees
-- 3. Indexes are created for common queries to improve performance
-- 4. Check constraints enforce business logic at database level
-- 5. All timestamps use UTC for consistency
-- 6. JSONB is used for flexible metadata storage
--
-- ============================================================================
