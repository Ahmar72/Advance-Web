-- Fix moderation and payment RLS so admin/moderator queues work correctly.

-- ADS: allow moderators/admins to read and update ads in review/admin queues
-- regardless of owner, based on JWT role.

drop policy if exists "Moderators can read review queue ads" on public.ads;
create policy "Moderators can read review queue ads"
  on public.ads
  for select
  to authenticated
  using (
    status in ('under_review', 'scheduled', 'payment_pending')
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

-- Allow moderators/admins to transition ads in the queues.
drop policy if exists "Moderators can update review queue ads" on public.ads;
create policy "Moderators can update review queue ads"
  on public.ads
  for update
  to authenticated
  using (
    status in ('under_review', 'scheduled', 'payment_pending')
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

-- MEDIA: moderators/admins can see media for ads in the moderation/admin queues.
drop policy if exists "Moderators can read media for review queue ads" on public.ad_media;
create policy "Moderators can read media for review queue ads"
  on public.ad_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ads a
      where a.id = ad_media.ad_id
        and a.status in ('under_review', 'scheduled', 'payment_pending')
    )
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

-- PAYMENTS: let admins/moderators read and manage all payments so that the
-- payment verification queue can work.

drop policy if exists "Admins and moderators can read payments" on public.payments;
create policy "Admins and moderators can read payments"
  on public.payments
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

-- Allow admins/moderators to verify or reject payments.
drop policy if exists "Admins and moderators can update payments" on public.payments;
create policy "Admins and moderators can update payments"
  on public.payments
  for update
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

select pg_notify('pgrst', 'reload schema');
