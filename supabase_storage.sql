-- Supabase Storage setup for CRM client files.
-- Bucket is private. Files are scoped by the first path segment: <owner_id>/<client_id>/<file>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-files', 'client-files', false, 52428800, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owner can read own client files" on storage.objects;
create policy "owner can read own client files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "client can read assigned storage files" on storage.objects;
create policy "client can read assigned storage files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-files'
  and exists (
    select 1
    from public.client_access access
    where access.user_id = auth.uid()
      and access.status = 'active'
      and access.owner_id::text = (storage.foldername(name))[1]
      and access.client_id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists "owner can upload own client files" on storage.objects;
create policy "owner can upload own client files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owner can update own client files" on storage.objects;
create policy "owner can update own client files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'client-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'client-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owner can delete own client files" on storage.objects;
create policy "owner can delete own client files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'client-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
