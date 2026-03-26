-- AdFlow Pro demo seed data
-- Run in Supabase SQL Editor after executing 001_init_schema.sql

-- Categories (used by Create Ad dropdown)
INSERT INTO categories (name, slug, is_active)
VALUES
  ('Electronics', 'electronics', true),
  ('Vehicles', 'vehicles', true),
  ('Properties', 'properties', true)
ON CONFLICT (slug) DO NOTHING;

-- Cities (used by Create Ad dropdown)
INSERT INTO cities (name, slug, is_active)
VALUES
  ('Karachi', 'karachi', true),
  ('Lahore', 'lahore', true),
  ('Islamabad', 'islamabad', true)
ON CONFLICT (slug) DO NOTHING;

-- Packages (used by Create Ad flow)
INSERT INTO packages (
  name,
  duration_days,
  weight,
  is_featured,
  price,
  refresh_rule,
  refresh_interval_days,
  is_active
)
VALUES
  ('Basic', 7, 1, false, 1999.00, 'none', NULL, true),
  ('Standard', 15, 2, false, 3999.00, 'manual', NULL, true),
  ('Premium', 30, 3, true, 6999.00, 'auto', 15, true)
ON CONFLICT (name) DO NOTHING;

-- Learning questions (used by the home page widget)
INSERT INTO learning_questions (question, answer, topic, difficulty, is_active)
VALUES
  (
    'What is RBAC?',
    'Role-Based Access Control (RBAC) restricts access to resources based on user roles.',
    'Security',
    'beginner',
    true
  ),
  (
    'Why use external media URLs instead of uploading images?',
    'It avoids storage/hosting complexity and keeps the database focused on workflow metadata.',
    'Architecture',
    'intermediate',
    true
  ),
  (
    'How should an ad become public in a moderated marketplace?',
    'Only after passing moderation and payment verification, and while it is within its publish/expire window.',
    'Workflow',
    'intermediate',
    true
  )
;

