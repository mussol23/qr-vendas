-- Add optional unit column to products (for unidade de medida)
alter table if exists public.products
	add column if not exists unit text;

-- Add optional full_name and phone to profiles for user data
alter table if exists public.profiles
	add column if not exists full_name text,
	add column if not exists phone text;

-- Ensure updated_at trigger continues to work (already present on products)
-- profiles may not need updated_at here; include only if your schema uses it:
-- alter table if exists public.profiles add column if not exists updated_at timestamptz default now();
-- create or replace trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();


