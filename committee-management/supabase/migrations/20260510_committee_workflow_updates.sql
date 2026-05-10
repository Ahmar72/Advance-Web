-- Supabase migration: committee workflow updates
-- Run this after the base schema has already been applied.

BEGIN;

ALTER TABLE committee_members
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';

ALTER TABLE committee_members
  DROP CONSTRAINT IF EXISTS committee_members_approval_status_check;

ALTER TABLE committee_members
  ADD CONSTRAINT committee_members_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

UPDATE committee_members
SET approval_status = COALESCE(approval_status, 'approved');

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('new_committee', 'upcoming_turn', 'payment_update', 'committee_message', 'join_request', 'join_request_response'));

DROP POLICY IF EXISTS "Creator can delete their committee" ON committees;
CREATE POLICY "Creator can delete their committee" ON committees
  FOR DELETE USING (creator_id = auth.uid());

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

COMMIT;
