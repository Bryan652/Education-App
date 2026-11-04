-- Build step 4: the schedule tables from PLANS/db-structure.md.

create table public.class_meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  -- Wall-clock times, so a class stays at 8:00 AM even if the student's time zone changes.
  start_time time not null,
  end_time time not null,
  location text check (char_length(location) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_meetings_times_in_order check (end_time > start_time),
  constraint class_meetings_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete cascade
);

create index class_meetings_subject_idx on public.class_meetings (subject_id, user_id);
create index class_meetings_user_id_idx on public.class_meetings (user_id, day_of_week);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Null for personal events. A null here also skips the foreign key below.
  subject_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  type text not null check (type in ('exam', 'assignment', 'task', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_times_in_order check (ends_at is null or ends_at >= starts_at),
  constraint events_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete cascade
);

create index events_user_id_starts_at_idx on public.events (user_id, starts_at);
create index events_subject_idx on public.events (subject_id, user_id);

create trigger class_meetings_set_updated_at
  before update on public.class_meetings
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.class_meetings enable row level security;
alter table public.events enable row level security;

revoke all on public.class_meetings from anon, authenticated;
revoke all on public.events from anon, authenticated;

grant select, delete on public.class_meetings to authenticated;
grant insert (subject_id, day_of_week, start_time, end_time, location) on public.class_meetings to authenticated;
grant update (subject_id, day_of_week, start_time, end_time, location) on public.class_meetings to authenticated;

grant select, delete on public.events to authenticated;
grant insert (subject_id, title, type, starts_at, ends_at, all_day, completed_at) on public.events to authenticated;
grant update (subject_id, title, type, starts_at, ends_at, all_day, completed_at) on public.events to authenticated;

create policy "Users can read their own class meetings"
  on public.class_meetings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own class meetings"
  on public.class_meetings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own class meetings"
  on public.class_meetings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own class meetings"
  on public.class_meetings for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own events"
  on public.events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own events"
  on public.events for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own events"
  on public.events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own events"
  on public.events for delete to authenticated
  using ((select auth.uid()) = user_id);
