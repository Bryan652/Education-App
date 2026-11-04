-- Build step 3: the grading tables from PLANS/db-structure.md.
-- Final grades and averages are calculated from these rows and never stored.

-- Lets other tables point at a subject and its owner together, the same way subjects point at
-- terms, so a student can't attach their rows to someone else's subject.
alter table public.subjects
  add constraint subjects_id_user_id_key unique (id, user_id);

create table public.grading_scales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  higher_is_better boolean not null default true,
  passing_grade_point numeric(4, 2) check (passing_grade_point >= 0),
  average_label text not null default 'GPA' check (char_length(btrim(average_label)) between 1 and 20),
  base_percent numeric(5, 2) not null default 0 check (base_percent >= 0 and base_percent < 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grading_scales_id_user_id_key unique (id, user_id)
);

create index grading_scales_user_id_idx on public.grading_scales (user_id);

create table public.grading_scale_bands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  scale_id uuid not null,
  min_percent numeric(5, 2) not null check (min_percent >= 0 and min_percent <= 100),
  label text not null check (char_length(btrim(label)) between 1 and 20),
  grade_point numeric(4, 2) check (grade_point >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grading_scale_bands_scale_min_key unique (scale_id, min_percent),
  constraint grading_scale_bands_scale_fkey foreign key (scale_id, user_id)
    references public.grading_scales (id, user_id)
    on delete cascade
);

create index grading_scale_bands_owner_idx on public.grading_scale_bands (scale_id, user_id);

-- Deleting a scale only clears these columns, because the owner columns must stay.
alter table public.profiles
  add column default_grading_scale_id uuid,
  add constraint profiles_default_grading_scale_fkey foreign key (default_grading_scale_id, id)
    references public.grading_scales (id, user_id)
    on delete set null (default_grading_scale_id);

alter table public.subjects
  add column grading_scale_id uuid,
  add constraint subjects_grading_scale_fkey foreign key (grading_scale_id, user_id)
    references public.grading_scales (id, user_id)
    on delete set null (grading_scale_id);

create index profiles_default_grading_scale_idx on public.profiles (default_grading_scale_id, id);
create index subjects_grading_scale_idx on public.subjects (grading_scale_id, user_id);

create table public.grade_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  weight numeric(5, 2) not null check (weight > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_categories_id_user_id_key unique (id, user_id),
  constraint grade_categories_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete cascade
);

create index grade_categories_subject_idx on public.grade_categories (subject_id, user_id);
create index grade_categories_user_id_idx on public.grade_categories (user_id);

create table public.grade_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  -- Scores can go above max_score for extra credit, but not below zero.
  score numeric(7, 2) check (score >= 0),
  max_score numeric(7, 2) not null check (max_score > 0),
  graded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_items_category_fkey foreign key (category_id, user_id)
    references public.grade_categories (id, user_id)
    on delete cascade
);

create index grade_items_category_idx on public.grade_items (category_id, user_id);
create index grade_items_user_id_idx on public.grade_items (user_id);

create trigger grading_scales_set_updated_at
  before update on public.grading_scales
  for each row execute function public.set_updated_at();

create trigger grading_scale_bands_set_updated_at
  before update on public.grading_scale_bands
  for each row execute function public.set_updated_at();

create trigger grade_categories_set_updated_at
  before update on public.grade_categories
  for each row execute function public.set_updated_at();

create trigger grade_items_set_updated_at
  before update on public.grade_items
  for each row execute function public.set_updated_at();

alter table public.grading_scales enable row level security;
alter table public.grading_scale_bands enable row level security;
alter table public.grade_categories enable row level security;
alter table public.grade_items enable row level security;

revoke all on public.grading_scales from anon, authenticated;
revoke all on public.grading_scale_bands from anon, authenticated;
revoke all on public.grade_categories from anon, authenticated;
revoke all on public.grade_items from anon, authenticated;

grant select, delete on public.grading_scales to authenticated;
grant insert (name, higher_is_better, passing_grade_point, average_label, base_percent)
  on public.grading_scales to authenticated;
grant update (name, higher_is_better, passing_grade_point, average_label, base_percent)
  on public.grading_scales to authenticated;

grant select, delete on public.grading_scale_bands to authenticated;
grant insert (scale_id, min_percent, label, grade_point) on public.grading_scale_bands to authenticated;
grant update (scale_id, min_percent, label, grade_point) on public.grading_scale_bands to authenticated;

grant select, delete on public.grade_categories to authenticated;
grant insert (subject_id, name, weight) on public.grade_categories to authenticated;
grant update (subject_id, name, weight) on public.grade_categories to authenticated;

grant select, delete on public.grade_items to authenticated;
grant insert (category_id, name, score, max_score, graded_on) on public.grade_items to authenticated;
grant update (category_id, name, score, max_score, graded_on) on public.grade_items to authenticated;

grant update (default_grading_scale_id) on public.profiles to authenticated;
grant insert (grading_scale_id) on public.subjects to authenticated;
grant update (grading_scale_id) on public.subjects to authenticated;

create policy "Users can read their own grading scales"
  on public.grading_scales for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own grading scales"
  on public.grading_scales for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own grading scales"
  on public.grading_scales for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own grading scales"
  on public.grading_scales for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own grading scale bands"
  on public.grading_scale_bands for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own grading scale bands"
  on public.grading_scale_bands for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own grading scale bands"
  on public.grading_scale_bands for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own grading scale bands"
  on public.grading_scale_bands for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own grade categories"
  on public.grade_categories for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own grade categories"
  on public.grade_categories for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own grade categories"
  on public.grade_categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own grade categories"
  on public.grade_categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own grade items"
  on public.grade_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own grade items"
  on public.grade_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own grade items"
  on public.grade_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own grade items"
  on public.grade_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Saves a scale and all of its bands together, so a failure can't leave a scale half edited.
-- Pass null as p_id to create one. It runs with the caller's rights, so row-level security still
-- decides what they can touch, and someone else's scale counts as not found.
create function public.save_grading_scale(
  p_id uuid,
  p_name text,
  p_higher_is_better boolean,
  p_passing_grade_point numeric,
  p_average_label text,
  p_base_percent numeric,
  p_bands jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if p_id is null then
    insert into public.grading_scales (name, higher_is_better, passing_grade_point, average_label, base_percent)
    values (p_name, p_higher_is_better, p_passing_grade_point, p_average_label, p_base_percent)
    returning id into saved_id;
  else
    update public.grading_scales
    set name = p_name,
        higher_is_better = p_higher_is_better,
        passing_grade_point = p_passing_grade_point,
        average_label = p_average_label,
        base_percent = p_base_percent
    where id = p_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'Grading scale not found' using errcode = 'P0002';
    end if;

    delete from public.grading_scale_bands where scale_id = saved_id;
  end if;

  insert into public.grading_scale_bands (scale_id, min_percent, label, grade_point)
  select saved_id, (band ->> 'min_percent')::numeric, band ->> 'label', (band ->> 'grade_point')::numeric
  from jsonb_array_elements(p_bands) as band;

  return saved_id;
end;
$$;

revoke execute on function public.save_grading_scale(uuid, text, boolean, numeric, text, numeric, jsonb)
  from public, anon;
grant execute on function public.save_grading_scale(uuid, text, boolean, numeric, text, numeric, jsonb)
  to authenticated;
