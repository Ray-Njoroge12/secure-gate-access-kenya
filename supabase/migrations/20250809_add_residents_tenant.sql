-- Add tenant scoping to residents table and align RLS with multi-tenancy
-- Safe to run multiple times (IF EXISTS / IF NOT EXISTS used where possible)

-- 1) Ensure community_id column exists and is referenced
alter table if exists public.residents
  add column if not exists community_id uuid references public.communities(id) on delete cascade;

-- 2) Index for tenant lookups
create index if not exists residents_community_idx
  on public.residents(community_id);

-- 3) Enable Row Level Security
alter table if exists public.residents enable row level security;

-- 4) Drop legacy/simple policies if present (will be replaced with tenant-aware ones)
drop policy if exists "Residents can view their own data" on public.residents;
drop policy if exists "Residents can update their own data" on public.residents;
drop policy if exists "Authenticated users can insert their own resident profile" on public.residents;

-- 5) Tenant-aware RLS policies
-- Ensure previous versions of these policies are dropped for idempotency
drop policy if exists residents_tenant_select on public.residents;
drop policy if exists residents_tenant_update on public.residents;
drop policy if exists residents_tenant_insert on public.residents;
drop policy if exists residents_tenant_delete on public.residents;

-- Allow admins and guards in the active tenant to read resident records in that tenant.
create policy residents_tenant_select
  on public.residents for select
  using (
    community_id = public.current_tenant_id()
    and (
      auth.uid() = id -- resident can read their own record
      or exists (
        select 1 from public.user_communities uc
        where uc.user_id = auth.uid()
          and uc.community_id = public.current_tenant_id()
          and uc.role in ('admin','guard')
      )
    )
  );

-- Allow resident to update their own record within tenant; admins can also update
create policy residents_tenant_update
  on public.residents for update
  using (
    community_id = public.current_tenant_id()
    and (
      auth.uid() = id
      or exists (
        select 1 from public.user_communities uc
        where uc.user_id = auth.uid()
          and uc.community_id = public.current_tenant_id()
          and uc.role = 'admin'
      )
    )
  )
  with check (
    community_id = public.current_tenant_id()
  );

-- Allow admins to insert resident records in their tenant
create policy residents_tenant_insert
  on public.residents for insert
  with check (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  );

-- Allow admins to delete resident records in their tenant
create policy residents_tenant_delete
  on public.residents for delete
  using (
    community_id = public.current_tenant_id()
    and exists (
      select 1 from public.user_communities uc
      where uc.user_id = auth.uid()
        and uc.community_id = public.current_tenant_id()
        and uc.role = 'admin'
    )
  );

-- 6) Ensure default tenant assignment on insert
-- Reuse the shared trigger function set_community_id_default()
-- Create trigger if not present
set check_function_bodies = off;
drop trigger if exists trg_residents_set_comm on public.residents;
create trigger trg_residents_set_comm
before insert on public.residents
for each row execute function public.set_community_id_default();
