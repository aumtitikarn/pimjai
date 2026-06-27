-- Pimjai migration — editable profiles + reaction notifications
--
-- 1) profiles — a signed-in member can override their display name and add a bio.
--    Keyed by LINE userId. The avatar stays the LINE picture (not editable), so
--    no storage is involved. Read/written only by trusted server routes via the
--    privileged pool, so no anon/authenticated grants are needed.
--
-- 2) notifications — when someone reacts to a member's letter, we record a ping
--    for the letter owner. Only members (letters with a non-null owner_id) ever
--    receive these. Also server-only; the client reads them through
--    GET /api/notifications.
--
-- Idempotent: safe to run on an existing database.

create table if not exists public.profiles (
  line_user_id text primary key,
  display_name text check (char_length(display_name) <= 40),
  bio          text check (char_length(bio) <= 200),
  updated_at   timestamptz not null default now()
);

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id text not null,          -- LINE userId of the letter owner
  pin_id       text not null,          -- which letter was reacted to
  actor_name   text,                   -- reactor's display name; null = anonymous
  reaction     text not null check (reaction in ('pat', 'hug', 'agree')),
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- Both tables are touched exclusively by the trusted server routes (privileged
-- DATABASE_URL connection), so RLS is left enabled-by-default with no public
-- policies — the anon/authenticated roles get no access at all.
alter table public.profiles      enable row level security;
alter table public.notifications enable row level security;
