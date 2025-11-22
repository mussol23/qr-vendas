-- Tabela de funcionários para gestão de equipe
create table if not exists public.employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null default 'operator', -- operator | manager | owner
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists employees_establishment_idx on public.employees(establishment_id);
create index if not exists employees_user_idx on public.employees(user_id);
create index if not exists employees_role_idx on public.employees(role);
create index if not exists employees_active_idx on public.employees(active);

create or replace trigger trg_employees_updated
before update on public.employees
for each row execute function public.set_updated_at();

alter table public.employees enable row level security;

-- Usuários podem ver funcionários do mesmo estabelecimento
drop policy if exists employees_read_same_establishment on public.employees;
create policy employees_read_same_establishment
on public.employees for select
using (
  establishment_id in (
    select establishment_id from public.profiles 
    where user_id = auth.uid()
  )
);

-- Apenas owners e managers podem criar/editar funcionários
drop policy if exists employees_write_owner_manager on public.employees;
create policy employees_write_owner_manager
on public.employees for all
using (
  exists (
    select 1 from public.user_establishments ue
    where ue.user_id = auth.uid()
    and ue.establishment_id = employees.establishment_id
    and ue.role in ('owner', 'manager')
  )
);
