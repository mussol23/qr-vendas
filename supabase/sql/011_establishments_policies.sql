-- Enable RLS and define basic policies
alter table public.establishments enable row level security;

-- Example: allow authenticated users to read active records
drop policy if exists establishments_read_active on public.establishments;
create policy establishments_read_active
on public.establishments for select
using (deleted_at is null and active = true);

-- Example: admin-only write via service role (handled by backend using service key)
-- You can refine with tenant checks if you include tenant_id claims
drop policy if exists establishments_no_direct_writes on public.establishments;
create policy establishments_no_direct_writes
on public.establishments for all
using (false)
with check (false);
