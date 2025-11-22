-- Products
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  establishment_id uuid references public.establishments(id) on delete set null,
  name text not null,
  price numeric not null,
  purchase_price numeric not null,
  category text,
  quantity integer not null default 0,
  qr_code text unique,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists products_establishment_idx on public.products(establishment_id);
create index if not exists products_updated_at_idx on public.products(updated_at);
create index if not exists products_deleted_at_idx on public.products(deleted_at);
create index if not exists products_category_idx on public.products(category);

create or replace trigger trg_products_updated
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Read active
drop policy if exists products_read_active on public.products;
create policy products_read_active
on public.products for select
using (deleted_at is null);

-- Block direct writes from client (backend via service role)
drop policy if exists products_no_direct_writes on public.products;
create policy products_no_direct_writes
on public.products for all
using (false)
with check (false);
