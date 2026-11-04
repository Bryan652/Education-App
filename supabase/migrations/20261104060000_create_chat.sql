-- Build step 7: the AI chat tables from PLANS/db-structure.md.
-- API keys are never stored here. They stay on the student's device.

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  subject_id uuid,
  note_id uuid,
  title text check (char_length(btrim(title)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_id_user_id_key unique (id, user_id),
  -- Deleting a subject or note keeps the chat, and only clears the link.
  constraint chat_threads_subject_fkey foreign key (subject_id, user_id)
    references public.subjects (id, user_id)
    on delete set null (subject_id),
  constraint chat_threads_note_fkey foreign key (note_id, user_id)
    references public.notes (id, user_id)
    on delete set null (note_id)
);

create index chat_threads_user_id_idx on public.chat_threads (user_id, updated_at desc);
create index chat_threads_subject_idx on public.chat_threads (subject_id, user_id);
create index chat_threads_note_idx on public.chat_threads (note_id, user_id);

-- Append-only, so there's no updated_at.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  thread_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 100000),
  created_at timestamptz not null default now(),
  constraint chat_messages_thread_fkey foreign key (thread_id, user_id)
    references public.chat_threads (id, user_id)
    on delete cascade
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, user_id, created_at);
create index chat_messages_user_id_idx on public.chat_messages (user_id);

create trigger chat_threads_set_updated_at
  before update on public.chat_threads
  for each row execute function public.set_updated_at();

-- A new message moves its chat to the top of the list. Setting title to itself fires the
-- updated_at trigger above, using only the columns students are allowed to update.
create function public.touch_chat_thread()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.chat_threads set title = title where id = new.thread_id;
  return new;
end;
$$;

revoke execute on function public.touch_chat_thread() from public, anon;
grant execute on function public.touch_chat_thread() to authenticated;

create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.touch_chat_thread();

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.chat_threads from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;

grant select, delete on public.chat_threads to authenticated;
grant insert (subject_id, note_id, title) on public.chat_threads to authenticated;
grant update (subject_id, note_id, title) on public.chat_threads to authenticated;

-- Messages can only be added. They go when their chat does, through the foreign key.
grant select on public.chat_messages to authenticated;
grant insert (thread_id, role, content) on public.chat_messages to authenticated;

create policy "Users can read their own chat threads"
  on public.chat_threads for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own chat threads"
  on public.chat_threads for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own chat threads"
  on public.chat_threads for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own chat threads"
  on public.chat_threads for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own chat messages"
  on public.chat_messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own chat messages"
  on public.chat_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Creates a chat and its first message together, so a failure can't leave an empty chat behind.
create function public.create_chat_thread(
  p_subject_id uuid,
  p_note_id uuid,
  p_title text,
  p_message text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.chat_threads (subject_id, note_id, title)
  values (p_subject_id, p_note_id, p_title)
  returning id into new_id;

  insert into public.chat_messages (thread_id, role, content)
  values (new_id, 'user', p_message);

  return new_id;
end;
$$;

revoke execute on function public.create_chat_thread(uuid, uuid, text, text) from public, anon;
grant execute on function public.create_chat_thread(uuid, uuid, text, text) to authenticated;
