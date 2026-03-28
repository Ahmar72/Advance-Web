-- Initial schema for AdFlow
-- Apply with: supabase db push (for linked project)

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'client' check (role in ('client', 'moderator', 'admin', 'super_admin')),
  is_verified_seller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days integer not null check (duration_days > 0),
  price numeric(12,2) not null check (price >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, duration_days)
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid references public.categories(id),
  city_id uuid references public.cities(id),
  package_id uuid references public.packages(id),
  title text not null,
  description text not null,
  slug text not null unique,
  status text not null default 'draft' check (
    status in (
      'draft',
      'under_review',
      'payment_pending',
      'payment_verified',
      'scheduled',
      'published',
      'expired',
      'rejected'
    )
  ),
  publish_at timestamptz,
  expire_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_media (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  original_url text not null,
  thumbnail_url text,
  source_type text not null default 'external' check (source_type in ('external', 'youtube', 'upload')),
  validation_status text not null default 'pending' check (validation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  package_id uuid references public.packages(id),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  method text not null default 'bank_transfer',
  transaction_ref text,
  sender_name text,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  topic text,
  difficulty text not null default 'easy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ads_user_id on public.ads (user_id);
create index if not exists idx_ads_status on public.ads (status);
create index if not exists idx_ads_created_at on public.ads (created_at desc);
create index if not exists idx_ads_category_id on public.ads (category_id);
create index if not exists idx_ads_city_id on public.ads (city_id);
create index if not exists idx_ads_package_id on public.ads (package_id);
create index if not exists idx_ad_media_ad_id on public.ad_media (ad_id);
create index if not exists idx_payments_ad_id on public.payments (ad_id);
create index if not exists idx_payments_status on public.payments (status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_users_touch_updated_at'
  ) then
    create trigger trg_users_touch_updated_at
      before update on public.users
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_categories_touch_updated_at'
  ) then
    create trigger trg_categories_touch_updated_at
      before update on public.categories
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_cities_touch_updated_at'
  ) then
    create trigger trg_cities_touch_updated_at
      before update on public.cities
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_packages_touch_updated_at'
  ) then
    create trigger trg_packages_touch_updated_at
      before update on public.packages
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_ads_touch_updated_at'
  ) then
    create trigger trg_ads_touch_updated_at
      before update on public.ads
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_ad_media_touch_updated_at'
  ) then
    create trigger trg_ad_media_touch_updated_at
      before update on public.ad_media
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_payments_touch_updated_at'
  ) then
    create trigger trg_payments_touch_updated_at
      before update on public.payments
      for each row
      execute function public.touch_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'trg_questions_touch_updated_at'
  ) then
    create trigger trg_questions_touch_updated_at
      before update on public.questions
      for each row
      execute function public.touch_updated_at();
  end if;
end $$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        updated_at = now();

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_auth_user_created();
  end if;
end $$;

insert into public.users (id, email, full_name)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name')
from auth.users au
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      updated_at = now();

alter table public.categories enable row level security;
alter table public.cities enable row level security;
alter table public.packages enable row level security;
alter table public.ads enable row level security;
alter table public.ad_media enable row level security;
alter table public.payments enable row level security;
alter table public.questions enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
  on public.categories
  for select
  using (is_active = true);

drop policy if exists "Public can read active cities" on public.cities;
create policy "Public can read active cities"
  on public.cities
  for select
  using (is_active = true);

drop policy if exists "Public can read active packages" on public.packages;
create policy "Public can read active packages"
  on public.packages
  for select
  using (is_active = true);

drop policy if exists "Public can read published ads" on public.ads;
create policy "Public can read published ads"
  on public.ads
  for select
  using (status = 'published');

drop policy if exists "Authenticated users can read own ads" on public.ads;
create policy "Authenticated users can read own ads"
  on public.ads
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can create own ads" on public.ads;
create policy "Authenticated users can create own ads"
  on public.ads
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update own ads" on public.ads;
create policy "Authenticated users can update own ads"
  on public.ads
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can delete own draft ads" on public.ads;
create policy "Authenticated users can delete own draft ads"
  on public.ads
  for delete
  to authenticated
  using (auth.uid() = user_id and status = 'draft');

drop policy if exists "Public can read media for published ads" on public.ad_media;
create policy "Public can read media for published ads"
  on public.ad_media
  for select
  using (
    exists (
      select 1 from public.ads a
      where a.id = ad_media.ad_id and a.status = 'published'
    )
  );

drop policy if exists "Authenticated users can manage media for own ads" on public.ad_media;
create policy "Authenticated users can manage media for own ads"
  on public.ad_media
  for all
  to authenticated
  using (
    exists (
      select 1 from public.ads a
      where a.id = ad_media.ad_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ads a
      where a.id = ad_media.ad_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can read own payments" on public.payments;
create policy "Authenticated users can read own payments"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.ads a
      where a.id = payments.ad_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can create payments for own ads" on public.payments;
create policy "Authenticated users can create payments for own ads"
  on public.payments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.ads a
      where a.id = payments.ad_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "Public can read questions" on public.questions;
create policy "Public can read questions"
  on public.questions
  for select
  using (true);

select pg_notify('pgrst', 'reload schema');
