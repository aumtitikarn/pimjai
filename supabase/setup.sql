-- Pimjai (พิมพ์ใจ) — Supabase setup
-- Run this in the Supabase SQL editor, or via `prisma migrate` using prisma/schema.prisma.

create extension if not exists "pgcrypto";

create type mood_type as enum ('pink', 'black', 'yellow');

create table if not exists public.pins (
  id          uuid primary key default gen_random_uuid(),
  text        text not null check (char_length(text) <= 4000), -- ciphertext can exceed 150 chars
  lat         double precision not null,
  lng         double precision not null,
  mood        mood_type not null default 'pink',
  is_locked   boolean not null default false,
  hint        text,
  created_at  timestamptz not null default now(),
  owner_id    text,         -- LINE userId when signed in; null for anonymous letters
  expires_at  timestamptz,  -- now()+24h when the author wants it to vanish; null = permanent
  -- Public author attribution, set only when a signed-in user opts to reveal their
  -- identity. Separate from owner_id (which stays private). Null = anonymous letter.
  author_name   text,
  author_avatar text,
  -- Denormalized reaction tallies (kept in sync by POST /api/pins/[id]/react).
  -- Public-readable so the map can glow without per-pin aggregate queries.
  pat_count   integer not null default 0,
  hug_count   integer not null default 0,
  agree_count integer not null default 0
);

-- One vote of one type on one letter by one voter. Composite PK makes a vote
-- idempotent and lets a tap toggle off. voter_id is a LINE userId when signed in,
-- else an anonymous per-browser cookie. Not exposed to the public anon key — all
-- reads/writes go through the trusted server route.
create table if not exists public.pin_reactions (
  pin_id     uuid not null references public.pins(id) on delete cascade,
  voter_id   text not null,
  type       text not null check (type in ('pat', 'hug', 'agree')),
  created_at timestamptz not null default now(),
  primary key (pin_id, voter_id, type)
);
create index if not exists pin_reactions_pin_idx on public.pin_reactions (pin_id);

create index if not exists pins_created_at_idx on public.pins (created_at desc);
create index if not exists pins_expires_at_idx on public.pins (expires_at);

alter table public.pins enable row level security;

-- Anonymous users can read all pins (locked pins still expose ciphertext + hint only).
-- The app filters expired anonymous letters out at query time
-- (expires_at is null or expires_at > now()).
create policy "Pins are publicly readable"
  on public.pins for select
  using (true);

-- NOTE: there is deliberately NO public insert policy. All writes go through the
-- trusted server route POST /api/pins, which connects with full DB credentials
-- (DATABASE_URL), reads the LINE session, and sets owner_id / expires_at
-- server-side so expiry and ownership cannot be forged from the public anon key.
-- That route also sweeps expired letters (delete where expires_at < now()).

-- owner_id holds a real LINE userId and must NOT be exposed to the public client.
-- RLS can't restrict columns, so we use column-level privileges: revoke blanket
-- SELECT from the public roles and re-grant every column EXCEPT owner_id. The
-- trusted server routes connect as the table owner (DATABASE_URL) and are
-- unaffected. After this, `select *` via the anon key fails on owner_id, so the
-- client selects an explicit column list (see hooks/usePins.ts).
revoke select on public.pins from anon, authenticated;
grant select (id, text, lat, lng, mood, is_locked, hint, created_at, expires_at,
              author_name, author_avatar, pat_count, hug_count, agree_count)
  on public.pins to anon, authenticated;

-- pin_reactions is private: the public client never reads raw votes (a voter_id
-- can be a LINE userId). Only the trusted server route touches it.
alter table public.pin_reactions enable row level security;

-- Storage bucket for temporary shareable PNG exports (optional — html-to-image can also
-- export client-side as a direct download without touching storage).
insert into storage.buckets (id, name, public)
values ('share-images', 'share-images', true)
on conflict (id) do nothing;

create policy "Share images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'share-images');

create policy "Anyone can upload a share image"
  on storage.objects for insert
  with check (bucket_id = 'share-images');
