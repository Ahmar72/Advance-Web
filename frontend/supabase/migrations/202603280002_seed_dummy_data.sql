-- Seed lookup/demo data for AdFlow

insert into public.categories (name, slug, is_active)
values
  ('Electronics', 'electronics', true),
  ('Vehicles', 'vehicles', true),
  ('Properties', 'properties', true),
  ('Jobs', 'jobs', true),
  ('Services', 'services', true)
on conflict (slug) do update
  set name = excluded.name,
      is_active = excluded.is_active,
      updated_at = now();

insert into public.cities (name, slug, is_active)
values
  ('Karachi', 'karachi', true),
  ('Lahore', 'lahore', true),
  ('Islamabad', 'islamabad', true),
  ('Rawalpindi', 'rawalpindi', true),
  ('Faisalabad', 'faisalabad', true)
on conflict (slug) do update
  set name = excluded.name,
      is_active = excluded.is_active,
      updated_at = now();

insert into public.packages (name, duration_days, price, is_featured, is_active)
values
  ('Basic', 7, 1999, false, true),
  ('Standard', 15, 3999, false, true),
  ('Premium', 30, 6999, true, true)
on conflict (name, duration_days) do update
  set price = excluded.price,
      is_featured = excluded.is_featured,
      is_active = excluded.is_active,
      updated_at = now();

insert into public.questions (question, answer, topic, difficulty)
values
  (
    'How can I make my listing stand out?',
    'Use a clear title, real photos, and detailed description. Choose a featured package for better visibility.',
    'listing-quality',
    'easy'
  ),
  (
    'Why is my ad under review?',
    'All ads go through moderation to ensure quality and compliance before publishing.',
    'moderation',
    'easy'
  )
on conflict do nothing;
