-- Auto adjust product stock on sale_items changes
create or replace function public.adjust_stock_on_insert()
returns trigger as $$
begin
  if new.product_id is not null then
    update public.products
      set quantity = greatest(0, quantity - new.quantity)
      where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.adjust_stock_on_update()
returns trigger as $$
begin
  if new.product_id is not null then
    -- revert old
    if old.product_id = new.product_id then
      update public.products
        set quantity = greatest(0, quantity + old.quantity - new.quantity)
        where id = new.product_id;
    else
      -- moved to different product
      update public.products set quantity = greatest(0, quantity + old.quantity) where id = old.product_id;
      update public.products set quantity = greatest(0, quantity - new.quantity) where id = new.product_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.adjust_stock_on_delete()
returns trigger as $$
begin
  if old.product_id is not null then
    update public.products
      set quantity = quantity + old.quantity
      where id = old.product_id;
  end if;
  return old;
end;
$$ language plpgsql;

-- Attach triggers
create or replace trigger trg_sale_items_stock_insert
after insert on public.sale_items
for each row execute function public.adjust_stock_on_insert();

create or replace trigger trg_sale_items_stock_update
after update on public.sale_items
for each row execute function public.adjust_stock_on_update();

create or replace trigger trg_sale_items_stock_delete
after delete on public.sale_items
for each row execute function public.adjust_stock_on_delete();
