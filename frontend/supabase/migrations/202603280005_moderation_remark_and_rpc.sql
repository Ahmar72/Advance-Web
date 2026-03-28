-- Add moderator-visible remarks on ads and provide secure moderation RPC.

alter table public.ads
  add column if not exists moderation_remark text;

create or replace function public.moderate_ad(
  p_ad_id uuid,
  p_decision text,
  p_remark text default null
)
returns public.ads
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_ad public.ads;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_decision not in ('scheduled', 'rejected', 'under_review') then
    raise exception 'Invalid moderation decision: %', p_decision;
  end if;

  select coalesce(au.raw_user_meta_data ->> 'role', u.role, 'client')
    into v_role
  from auth.users au
  left join public.users u on u.id = au.id
  where au.id = auth.uid();

  if v_role not in ('moderator', 'admin', 'super_admin') then
    raise exception 'Forbidden: moderator role required';
  end if;

  update public.ads
  set
    status = p_decision,
    moderation_remark = nullif(trim(p_remark), ''),
    updated_at = now()
  where id = p_ad_id
    and status in ('under_review', 'payment_pending')
  returning * into v_ad;

  if not found then
    raise exception 'Ad not found or not in moderation queue';
  end if;

  return v_ad;
end;
$$;

grant execute on function public.moderate_ad(uuid, text, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
