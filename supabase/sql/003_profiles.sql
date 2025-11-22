-- Profiles linked to Supabase auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user', -- 'user' | 'admin'
  tenant_id uuid,
  establishment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tenant_idx on public.profiles(tenant_id);
create index if not exists profiles_establishment_idx on public.profiles(establishment_id);

create or replace trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- User can select own profile
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles for select
using (auth.uid() = user_id);

-- User can update own profile (optional)
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admins (role claim) can read all
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read
on public.profiles for select
using ((auth.jwt() ->> 'role') = 'admin');
