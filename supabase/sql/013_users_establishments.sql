-- Link users (profiles) to establishments with roles
create table if not exists public.user_establishments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  role text not null default 'operator', -- operator | manager | admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, establishment_id)
);

create index if not exists user_est_establishment_idx on public.user_establishments(establishment_id);
create index if not exists user_est_user_idx on public.user_establishments(user_id);

create or replace trigger trg_user_establishments_updated
before update on public.user_establishments
for each row execute function public.set_updated_at();

alter table public.user_establishments enable row level security;

-- Users can read their own links
drop policy if exists user_est_read_self on public.user_establishments;
create policy user_est_read_self
on public.user_establishments for select to authenticated
using (auth.uid() = user_id);

-- No direct writes from client
drop policy if exists user_est_no_direct_writes on public.user_establishments;
create policy user_est_no_direct_writes
on public.user_establishments for all
using (false)
with check (false);
