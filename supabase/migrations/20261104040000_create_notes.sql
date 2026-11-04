-- Build step 5: the notes tables and file storage from PLANS/db-structure.md.
-- The limits here must match src/lib/notes/limits.ts, which gives students friendlier messages.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  content jsonb check (octet_length(content::text) <= 500000),
  plain_text text check (char_length(plain_text) <= 500000),
  search_vector tsvector generated always as (
    to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || coalesce(plain_text, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_id_user_id_key unique (id, user_id),
  constraint notes_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete cascade
);

create index notes_search_vector_idx on public.notes using gin (search_vector);
create index notes_subject_idx on public.notes (subject_id, user_id);
create index notes_user_id_idx on public.notes (user_id, updated_at desc);

create table public.note_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  note_id uuid not null,
  storage_path text not null unique,
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text check (char_length(mime_type) <= 255),
  size_bytes bigint check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A row can only ever point at a file in its owner's own folder.
  constraint note_files_path_in_own_folder check (split_part(storage_path, '/', 1) = user_id::text),
  constraint note_files_note_fkey foreign key (note_id, user_id)
    references public.notes (id, user_id)
    on delete cascade
);

create index note_files_note_idx on public.note_files (note_id, user_id);
create index note_files_user_id_idx on public.note_files (user_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create trigger note_files_set_updated_at
  before update on public.note_files
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;
alter table public.note_files enable row level security;

revoke all on public.notes from anon, authenticated;
revoke all on public.note_files from anon, authenticated;

grant select, delete on public.notes to authenticated;
grant insert (subject_id, title, content, plain_text) on public.notes to authenticated;
grant update (subject_id, title, content, plain_text) on public.notes to authenticated;

-- File rows are never edited, only added and removed.
grant select, delete on public.note_files to authenticated;
grant insert (note_id, storage_path, file_name, mime_type, size_bytes) on public.note_files to authenticated;

create policy "Users can read their own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own note files"
  on public.note_files for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own note files"
  on public.note_files for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own note files"
  on public.note_files for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Private bucket. Supabase itself rejects files over 10 MB or of any other type, even if someone
-- skips the app and calls the Storage API directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-files',
  'note-files',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
);

create policy "Users can read their own stored note files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'note-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- How much the signed-in student has stored. Counting stored objects, not note_files rows, means
-- files uploaded without a matching row still count. A policy on storage.objects can't query
-- storage.objects itself (Postgres treats that as infinite recursion), so this runs with elevated
-- rights. It only ever reports on the caller's own folder.
create function public.note_storage_used_bytes()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((metadata ->> 'size')::bigint), 0)::bigint
  from storage.objects
  where bucket_id = 'note-files'
    and (storage.foldername(name))[1] = auth.uid()::text;
$$;

revoke execute on function public.note_storage_used_bytes() from public, anon;
grant execute on function public.note_storage_used_bytes() to authenticated;

-- Blocks new uploads once a student has stored 50 MB. The size of the new file isn't known at this
-- point, so a student can go over by at most one file.
create policy "Users can add files to their own folder within their quota"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'note-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.note_storage_used_bytes()) < 52428800
  );

create policy "Users can delete their own stored note files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'note-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
