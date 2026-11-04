-- Build step 2: the terms and subjects tables from PLANS/db-structure.md.

-- Subjects and terms need a profile to belong to, so make sure every account has one.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint terms_dates_in_order check (end_date >= start_date),
  -- Lets subjects point at a term and its owner together. See the foreign key below.
  constraint terms_id_user_id_key unique (id, user_id)
);

create index terms_user_id_idx on public.terms (user_id, start_date desc);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  term_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  code text check (char_length(code) <= 30),
  instructor text check (char_length(instructor) <= 100),
  color text check (color ~ '^#[0-9a-fA-F]{6}$'),
  units numeric(4, 2) check (units >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Including user_id means a student can't attach a subject to someone else's term.
  -- Deleting a term only clears term_id, because user_id must stay.
  constraint subjects_term_fkey foreign key (term_id, user_id)
    references public.terms (id, user_id)
    on delete set null (term_id)
);

create index subjects_user_id_idx on public.subjects (user_id, archived_at);
create index subjects_term_id_idx on public.subjects (term_id, user_id);

create trigger terms_set_updated_at
  before update on public.terms
  for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- Students only get the columns they should change. user_id always comes from their
-- login through its default, so it can't be set or changed from the app.
alter table public.terms enable row level security;
alter table public.subjects enable row level security;

revoke all on public.terms from anon, authenticated;
revoke all on public.subjects from anon, authenticated;

grant select, delete on public.terms to authenticated;
grant insert (name, start_date, end_date) on public.terms to authenticated;
grant update (name, start_date, end_date) on public.terms to authenticated;

grant select, delete on public.subjects to authenticated;
grant insert (term_id, name, code, instructor, color, units) on public.subjects to authenticated;
grant update (term_id, name, code, instructor, color, units, archived_at) on public.subjects to authenticated;

create policy "Users can read their own terms"
  on public.terms for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own terms"
  on public.terms for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own terms"
  on public.terms for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own terms"
  on public.terms for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own subjects"
  on public.subjects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own subjects"
  on public.subjects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own subjects"
  on public.subjects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own subjects"
  on public.subjects for delete to authenticated
  using ((select auth.uid()) = user_id);
