-- Create storage buckets for the app
-- Requires storage extension (enabled by default in Supabase)
do $$ begin
  perform storage.create_bucket('product-images', jsonb_build_object('public', true));
exception when others then null; end $$;
do $$ begin
  perform storage.create_bucket('documents', jsonb_build_object('public', false));
exception when others then null; end $$;
do $$ begin
  perform storage.create_bucket('qr-codes', jsonb_build_object('public', true));
exception when others then null; end $$;

-- Storage policies
-- Read product images (public)
drop policy if exists product_images_read on storage.objects;
create policy product_images_read on storage.objects for select
  using ( bucket_id = 'product-images' );
-- Write product images: authenticated users only
drop policy if exists product_images_write on storage.objects;
create policy product_images_write on storage.objects for insert to authenticated
  with check ( bucket_id = 'product-images' );
drop policy if exists product_images_update on storage.objects;
create policy product_images_update on storage.objects for update to authenticated
  using ( bucket_id = 'product-images' ) with check ( bucket_id = 'product-images' );

-- Documents (private): only owner (by auth.uid())
-- Expecting path convention: user_id/<whatever>
drop policy if exists documents_owner_read on storage.objects;
create policy documents_owner_read on storage.objects for select to authenticated
  using ( bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text );
drop policy if exists documents_owner_write on storage.objects;
create policy documents_owner_write on storage.objects for insert to authenticated
  with check ( bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text );
drop policy if exists documents_owner_update on storage.objects;
create policy documents_owner_update on storage.objects for update to authenticated
  using ( bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text )
  with check ( bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text );

-- QR codes (public read, authenticated write)
drop policy if exists qrcodes_read on storage.objects;
create policy qrcodes_read on storage.objects for select
  using ( bucket_id = 'qr-codes' );
drop policy if exists qrcodes_write on storage.objects;
create policy qrcodes_write on storage.objects for insert to authenticated
  with check ( bucket_id = 'qr-codes' );
drop policy if exists qrcodes_update on storage.objects;
create policy qrcodes_update on storage.objects for update to authenticated
  using ( bucket_id = 'qr-codes' ) with check ( bucket_id = 'qr-codes' );
