-- Create audit log table used by moderator flag action

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_target on public.audit_logs (target_type, target_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "Moderators can insert audit logs" on public.audit_logs;
create policy "Moderators can insert audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

drop policy if exists "Moderators can read audit logs" on public.audit_logs;
create policy "Moderators can read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'client')
      in ('moderator', 'admin', 'super_admin')
  );

select pg_notify('pgrst', 'reload schema');
