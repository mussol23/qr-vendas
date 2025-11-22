-- Sales (documents: invoice, receipt, invoice-receipt)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sale_type') then
    create type public.sale_type as enum ('receipt', 'invoice', 'invoice-receipt');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'sale_status') then
    create type public.sale_status as enum ('pending', 'paid');
  end if;
end $$;

create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  establishment_id uuid references public.establishments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  number text, -- human readable id (e.g., RC-0001)
  date timestamptz not null default now(),
  due_date timestamptz,
  total numeric not null default 0,
  profit numeric,
  type public.sale_type not null,
  observations text,
  external_reference text,
  payment_method text,
  status public.sale_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sales_establishment_idx on public.sales(establishment_id);
create index if not exists sales_client_idx on public.sales(client_id);
create index if not exists sales_date_idx on public.sales(date);
create index if not exists sales_updated_at_idx on public.sales(updated_at);
create index if not exists sales_deleted_at_idx on public.sales(deleted_at);
create index if not exists sales_type_idx on public.sales(type);

create or replace trigger trg_sales_updated
before update on public.sales
for each row execute function public.set_updated_at();

alter table public.sales enable row level security;

drop policy if exists sales_read_active on public.sales;
create policy sales_read_active
on public.sales for select
using (deleted_at is null);

drop policy if exists sales_no_direct_writes on public.sales;
create policy sales_no_direct_writes
on public.sales for all
using (false)
with check (false);
