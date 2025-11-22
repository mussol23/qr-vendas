-- Clients
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  establishment_id uuid references public.establishments(id) on delete set null,
  name text not null,
  phone text,
  address text,
  nif text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists clients_establishment_idx on public.clients(establishment_id);
create index if not exists clients_updated_at_idx on public.clients(updated_at);
create index if not exists clients_deleted_at_idx on public.clients(deleted_at);
create index if not exists clients_name_idx on public.clients(name);

create or replace trigger trg_clients_updated
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists clients_read_active on public.clients;
create policy clients_read_active
on public.clients for select
using (deleted_at is null);

drop policy if exists clients_no_direct_writes on public.clients;
create policy clients_no_direct_writes
on public.clients for all
using (false)
with check (false);
