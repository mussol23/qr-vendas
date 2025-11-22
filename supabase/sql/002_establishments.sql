-- Establishments table for admin management and sync
create extension if not exists "uuid-ossp";

create table if not exists public.establishments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  document text, -- NIF
  phone text,
  address text,
  tenant_id uuid, -- optional multi-tenant segregation
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists establishments_updated_at_idx on public.establishments(updated_at);
create index if not exists establishments_deleted_at_idx on public.establishments(deleted_at);
create index if not exists establishments_tenant_idx on public.establishments(tenant_id);
