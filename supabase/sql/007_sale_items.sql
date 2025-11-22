-- Sale items
create table if not exists public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric not null, -- unit price at time of sale
  purchase_price numeric, -- unit purchase price at time of sale
  total numeric generated always as ((price * quantity)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sale_items_sale_idx on public.sale_items(sale_id);
create index if not exists sale_items_product_idx on public.sale_items(product_id);

create or replace trigger trg_sale_items_updated
before update on public.sale_items
for each row execute function public.set_updated_at();

alter table public.sale_items enable row level security;
drop policy if exists sale_items_read on public.sale_items;
create policy sale_items_read
on public.sale_items for select
using (true);

drop policy if exists sale_items_no_direct_writes on public.sale_items;
create policy sale_items_no_direct_writes
on public.sale_items for all
using (false)
with check (false);
