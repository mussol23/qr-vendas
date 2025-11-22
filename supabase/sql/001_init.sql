-- Init extensions and helper functions
create extension if not exists "uuid-ossp";

-- Common trigger to update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
