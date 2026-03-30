-- Align moderation RLS with app auth flow by reading role from JWT metadata.
-- The frontend sets role in auth user_metadata, so policies should rely on auth.jwt().

drop policy if exists "Moderators can read review queue ads" on public.ads;
create policy "Moderators can read review queue ads"
  on public.ads
  for select
  to authenticated
  using (
    status in ('under_review', 'payment_pending')
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

drop policy if exists "Moderators can update review queue ads" on public.ads;
create policy "Moderators can update review queue ads"
  on public.ads
  for update
  to authenticated
  using (
    status in ('under_review', 'payment_pending')
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

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
        and a.status in ('under_review', 'payment_pending')
    )
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

select pg_notify('pgrst', 'reload schema');
