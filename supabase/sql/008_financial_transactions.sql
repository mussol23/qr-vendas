-- Financial transactions (revenues/expenses)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'tx_type') then
    create type public.tx_type as enum ('revenue', 'expense');
  end if;
end $$;

create table if not exists public.financial_transactions (
  id uuid primary key default uuid_generate_v4(),
  establishment_id uuid references public.establishments(id) on delete set null,
  type public.tx_type not null,
  description text not null,
  amount numeric not null,
  date timestamptz not null default now(),
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists fin_tx_establishment_idx on public.financial_transactions(establishment_id);
create index if not exists fin_tx_date_idx on public.financial_transactions(date);
create index if not exists fin_tx_updated_at_idx on public.financial_transactions(updated_at);
create index if not exists fin_tx_deleted_at_idx on public.financial_transactions(deleted_at);
create index if not exists fin_tx_category_idx on public.financial_transactions(category);

create or replace trigger trg_financial_transactions_updated
before update on public.financial_transactions
for each row execute function public.set_updated_at();

alter table public.financial_transactions enable row level security;

drop policy if exists fin_tx_read_active on public.financial_transactions;
create policy fin_tx_read_active
on public.financial_transactions for select
using (deleted_at is null);

drop policy if exists fin_tx_no_direct_writes on public.financial_transactions;
create policy fin_tx_no_direct_writes
on public.financial_transactions for all
using (false)
with check (false);
