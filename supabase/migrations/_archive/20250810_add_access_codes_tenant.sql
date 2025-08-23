-- Add tenant scoping to access_codes and align RLS with multi-tenancy
-- Safe to run multiple times (IF EXISTS / IF NOT EXISTS used where possible)

-- 1) Ensure community_id column exists and is referenced
alter table if exists public.access_codes
  add column if not exists community_id uuid references public.communities(id) on delete cascade;

-- 2) Helpful indexes
create index if not exists access_codes_community_idx
  on public.access_codes(community_id);
create index if not exists access_codes_qr_token_idx
  on public.access_codes(qr_token);
create index if not exists access_codes_expires_used_idx
  on public.access_codes(expires_at, used_at);

-- 3) Enable Row Level Security
alter table if exists public.access_codes enable row level security;

-- 4) Replace legacy/simple policies with tenant-aware ones
-- Drop legacy policies if present
drop policy if exists "Visitors can view their own access codes" on public.access_codes;
drop policy if exists "Security guards can view all access codes" on public.access_codes;
drop policy if exists "System can create access codes" on public.access_codes;
drop policy if exists "System can update access codes" on public.access_codes;

-- Ensure previous versions of tenant policies are dropped for idempotency
drop policy if exists access_codes_tenant_select on public.access_codes;
drop policy if exists access_codes_tenant_insert on public.access_codes;
drop policy if exists access_codes_tenant_update on public.access_codes;

-- Tenant-aware read within active community
create policy access_codes_tenant_select
  on public.access_codes for select
  using (
    community_id = public.current_tenant_id()
  );

-- Tenant-aware insert
create policy access_codes_tenant_insert
  on public.access_codes for insert
  with check (
    community_id = public.current_tenant_id()
  );

-- Tenant-aware update
create policy access_codes_tenant_update
  on public.access_codes for update
  using (
    community_id = public.current_tenant_id()
  )
  with check (
    community_id = public.current_tenant_id()
  );

-- 5) Ensure default tenant assignment on insert (best-effort; service role should set explicitly)
-- Reuse the shared trigger function set_community_id_default()
set check_function_bodies = off;
drop trigger if exists trg_access_codes_set_comm on public.access_codes;
create trigger trg_access_codes_set_comm
before insert on public.access_codes
for each row execute function public.set_community_id_default();
