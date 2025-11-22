-- Product categories (optional normalization)
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create or replace trigger trg_categories_updated
before update on public.categories
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
drop policy if exists categories_read_active on public.categories;
create policy categories_read_active
on public.categories for select
using (deleted_at is null);

drop policy if exists categories_no_direct_writes on public.categories;
create policy categories_no_direct_writes
on public.categories for all
using (false)
with check (false);
