-- Tenants (optional, for multi-tenant segregation)
create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace trigger trg_tenants_updated
before update on public.tenants
for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;

-- Admins can read; regular users no direct access unless needed
drop policy if exists tenants_admin_read on public.tenants;
create policy tenants_admin_read
on public.tenants for select
using ((auth.jwt() ->> 'role') = 'admin');

drop policy if exists tenants_no_direct_writes on public.tenants;
create policy tenants_no_direct_writes
on public.tenants for all
using (false)
with check (false);
