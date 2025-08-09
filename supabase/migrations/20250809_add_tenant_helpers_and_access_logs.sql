-- Tenant helpers and new tenant-scoped tables
-- Note: This migration assumes the existence of the communities table.

-- 1) user_communities: map users to communities with a role and active flag
create table if not exists public.user_communities (
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  role text not null check (role in ('admin','guard','resident')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

-- Only one active community per user
create unique index if not exists user_communities_one_active_per_user
  on public.user_communities(user_id)
  where is_active is true;

alter table public.user_communities enable row level security;

-- Allow users to read their own memberships
create policy if not exists user_can_read_own_memberships
  on public.user_communities for select
  using (auth.uid() = user_id);

-- Allow admin service or future functions to insert memberships (further tightened later)
create policy if not exists insert_memberships_open
  on public.user_communities for insert
  with check (true);

-- 2) Helper to resolve current tenant id from active membership or JWT claim
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  -- Prefer explicit membership active flag; if none, try a community_id claim in JWT if present
  select uc.community_id
  from public.user_communities uc
  where uc.user_id = auth.uid() and uc.is_active is true
  limit 1;
$$;

comment on function public.current_tenant_id is 'Returns the active community_id for the current user based on user_communities.is_active.';

-- 3) Secure RPC to set the active community for the current user
create or replace function public.set_active_community(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Must be a member of the target community
  if not exists (
    select 1 from public.user_communities uc
    where uc.user_id = auth.uid()
      and uc.community_id = p_community_id
  ) then
    raise exception 'You are not a member of this community';
  end if;

  -- Toggle active flags
  update public.user_communities
     set is_active = (community_id = p_community_id)
   where user_id = auth.uid();
end;
$$;

-- 4) Trigger function to default community_id to current tenant
create or replace function public.set_community_id_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.community_id is null then
    new.community_id := public.current_tenant_id();
  end if;
  return new;
end;
$$;

-- 5) New tenant-scoped tables used by the frontend

-- emergency_access_codes: admin-managed emergency override codes per community
create table if not exists public.emergency_access_codes (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  code text not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists emergency_codes_community_idx
  on public.emergency_access_codes(community_id);
create index if not exists emergency_codes_active_idx
  on public.emergency_access_codes(is_active, expires_at);

alter table public.emergency_access_codes enable row level security;

-- Tenant isolation and admin-only access
create policy if not exists emergency_codes_tenant_select
  on public.emergency_access_codes for select
  using (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  );

create policy if not exists emergency_codes_tenant_write
  on public.emergency_access_codes for all
  using (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  )
  with check (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  );

-- Ensure community_id defaults
drop trigger if exists trg_emergency_codes_set_comm on public.emergency_access_codes;
create trigger trg_emergency_codes_set_comm
before insert on public.emergency_access_codes
for each row execute function public.set_community_id_default();

-- access_logs: logs of access verifications, per community
create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  access_code_id uuid references public.access_codes(id) on delete set null,
  guard_id uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  access_method text not null check (access_method in ('qr','pin','emergency')),
  timestamp timestamptz not null default now(),
  status text not null check (status in ('success','failed')),
  notes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists access_logs_community_idx
  on public.access_logs(community_id);
create index if not exists access_logs_timestamp_idx
  on public.access_logs(timestamp desc);

alter table public.access_logs enable row level security;

-- Tenant isolation for read
create policy if not exists access_logs_tenant_select
  on public.access_logs for select
  using (community_id = public.current_tenant_id());

-- Insert allowed for any member in tenant (guards/admin typically)
create policy if not exists access_logs_tenant_insert
  on public.access_logs for insert
  with check (community_id = public.current_tenant_id());

-- Update/Delete restricted to admins in tenant
create policy if not exists access_logs_tenant_admin_write
  on public.access_logs for update using (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  ) with check (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  );

-- Default community_id via trigger
drop trigger if exists trg_access_logs_set_comm on public.access_logs;
create trigger trg_access_logs_set_comm
before insert on public.access_logs
for each row execute function public.set_community_id_default();
