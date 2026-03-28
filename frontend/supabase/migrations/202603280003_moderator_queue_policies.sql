-- Allow moderator/admin roles to review client ads in moderation queue

-- Ads: moderators can read ads that are in moderation queue statuses
-- while regular users keep their existing own-ads access policies.
drop policy if exists "Moderators can read review queue ads" on public.ads;
create policy "Moderators can read review queue ads"
  on public.ads
  for select
  to authenticated
  using (
    status in ('under_review', 'payment_pending')
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role in ('moderator', 'admin', 'super_admin')
    )
  );

-- Ads: moderators can update queue items to approved/rejected/etc.
drop policy if exists "Moderators can update review queue ads" on public.ads;
create policy "Moderators can update review queue ads"
  on public.ads
  for update
  to authenticated
  using (
    status in ('under_review', 'payment_pending')
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role in ('moderator', 'admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role in ('moderator', 'admin', 'super_admin')
    )
  );

-- Media: moderators can read media attached to queue ads.
drop policy if exists "Moderators can read media for review queue ads" on public.ad_media;
create policy "Moderators can read media for review queue ads"
  on public.ad_media
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ads a
      join public.users u on u.id = auth.uid()
      where a.id = ad_media.ad_id
        and a.status in ('under_review', 'payment_pending')
        and u.role in ('moderator', 'admin', 'super_admin')
    )
  );

select pg_notify('pgrst', 'reload schema');
