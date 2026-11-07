-- Build step 8: the google_connections table from PLANS/db-structure.md.
-- Holds each student's Google Calendar access. Only server code can use it, through the
-- service-role key, so the browser can't read even the encrypted refresh token.

create table public.google_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- AES-256-GCM, with a key that only the server has. See src/lib/google/crypto.ts.
  refresh_token_encrypted text not null,
  scopes text[],
  google_email text,
  -- The calendar the app made in the student's Google account. Null until the first sync.
  calendar_id text,
  last_synced_at timestamptz,
  -- Null when the last sync worked. 'reconnect' means Google no longer accepts the token.
  sync_error text check (char_length(sync_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger google_connections_set_updated_at
  before update on public.google_connections
  for each row execute function public.set_updated_at();

-- Row-level security with no policies, and no grants, means only the service role gets in.
alter table public.google_connections enable row level security;

revoke all on public.google_connections from anon, authenticated;
