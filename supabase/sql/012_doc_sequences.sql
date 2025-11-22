-- Sequences for human-readable document numbers per establishment and type
create table if not exists public.doc_sequences (
  id uuid primary key default uuid_generate_v4(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  doc_type public.sale_type not null,
  current_number integer not null default 0,
  prefix text not null, -- e.g., 'RC', 'FT', 'FR'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, doc_type)
);

create or replace trigger trg_doc_sequences_updated
before update on public.doc_sequences
for each row execute function public.set_updated_at();

create or replace function public.next_doc_number(p_establishment_id uuid, p_doc_type public.sale_type)
returns text as $$
declare
  v_prefix text;
  v_seq int;
  v_row public.doc_sequences%rowtype;
begin
  if p_doc_type = 'receipt' then v_prefix := 'RC';
  elsif p_doc_type = 'invoice' then v_prefix := 'FT';
  else v_prefix := 'FR';
  end if;

  select * into v_row from public.doc_sequences 
    where establishment_id = p_establishment_id and doc_type = p_doc_type for update;

  if not found then
    insert into public.doc_sequences(establishment_id, doc_type, current_number, prefix)
    values (p_establishment_id, p_doc_type, 1, v_prefix)
    returning * into v_row;
    v_seq := 1;
  else
    update public.doc_sequences set current_number = current_number + 1 where id = v_row.id returning current_number into v_seq;
  end if;

  return format('%s-%s', v_prefix, lpad(v_seq::text, 4, '0'));
end;
$$ language plpgsql volatile;

-- Trigger to fill sales.number when null
create or replace function public.set_sales_number()
returns trigger as $$
begin
  if new.number is null then
    new.number = public.next_doc_number(new.establishment_id, new.type);
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_sales_number
before insert on public.sales
for each row execute function public.set_sales_number();
