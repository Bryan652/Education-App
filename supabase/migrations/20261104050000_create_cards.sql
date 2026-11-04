-- Build step 6: the quiz card tables from PLANS/db-structure.md.

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid not null,
  source_note_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decks_id_user_id_key unique (id, user_id),
  constraint decks_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete cascade,
  -- Deleting the note only clears this column, because user_id must stay.
  constraint decks_source_note_fkey foreign key (source_note_id, user_id)
    references public.notes (id, user_id)
    on delete set null (source_note_id)
);

create index decks_subject_idx on public.decks (subject_id, user_id);
create index decks_source_note_idx on public.decks (source_note_id, user_id);
create index decks_user_id_idx on public.decks (user_id);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  deck_id uuid not null,
  front text not null check (char_length(btrim(front)) between 1 and 2000),
  back text not null check (char_length(btrim(back)) between 1 and 2000),
  -- New cards are due straight away, and have no state until their first review.
  due_at timestamptz not null default now(),
  fsrs_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_id_user_id_key unique (id, user_id),
  constraint cards_deck_fkey foreign key (deck_id, user_id)
    references public.decks (id, user_id)
    on delete cascade
);

create index cards_user_id_due_at_idx on public.cards (user_id, due_at);
create index cards_deck_idx on public.cards (deck_id, user_id);

-- Append-only history, so there's no updated_at.
create table public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  card_id uuid not null,
  rating smallint not null check (rating between 1 and 4),
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint card_reviews_card_fkey foreign key (card_id, user_id)
    references public.cards (id, user_id)
    on delete cascade
);

create index card_reviews_card_idx on public.card_reviews (card_id, user_id);
create index card_reviews_user_id_idx on public.card_reviews (user_id, reviewed_at desc);

create trigger decks_set_updated_at
  before update on public.decks
  for each row execute function public.set_updated_at();

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.card_reviews enable row level security;

revoke all on public.decks from anon, authenticated;
revoke all on public.cards from anon, authenticated;
revoke all on public.card_reviews from anon, authenticated;

grant select, delete on public.decks to authenticated;
grant insert (subject_id, source_note_id, name) on public.decks to authenticated;
grant update (subject_id, source_note_id, name) on public.decks to authenticated;

grant select, delete on public.cards to authenticated;
grant insert (deck_id, front, back) on public.cards to authenticated;
grant update (deck_id, front, back, due_at, fsrs_state) on public.cards to authenticated;

-- History can only be added to. Reviews go when their card does, through the foreign key.
grant select on public.card_reviews to authenticated;
grant insert (card_id, rating) on public.card_reviews to authenticated;

create policy "Users can read their own decks"
  on public.decks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own decks"
  on public.decks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own decks"
  on public.decks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own decks"
  on public.decks for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own cards"
  on public.cards for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own cards"
  on public.cards for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own cards"
  on public.cards for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own cards"
  on public.cards for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own card reviews"
  on public.card_reviews for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own card reviews"
  on public.card_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Updates a card's schedule and adds to its history together, so they can't disagree. It runs with
-- the caller's rights, so row-level security still applies, and someone else's card counts as not found.
create function public.record_card_review(
  p_card_id uuid,
  p_rating smallint,
  p_due_at timestamptz,
  p_fsrs_state jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.cards
  set due_at = p_due_at,
      fsrs_state = p_fsrs_state
  where id = p_card_id;

  if not found then
    raise exception 'Card not found' using errcode = 'P0002';
  end if;

  insert into public.card_reviews (card_id, rating)
  values (p_card_id, p_rating);
end;
$$;

revoke execute on function public.record_card_review(uuid, smallint, timestamptz, jsonb) from public, anon;
grant execute on function public.record_card_review(uuid, smallint, timestamptz, jsonb) to authenticated;
