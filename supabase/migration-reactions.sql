-- Pimjai migration — reaction buttons (ตบบ่า / กอดปลอบ / เห็นด้วย)
--
-- Adds denormalized per-letter reaction tallies plus a votes table for
-- idempotent, toggleable reactions. agree_count drives the gold "glow" tier on
-- the map. Counts are public-readable; raw votes (pin_reactions) stay private.
--
-- Idempotent: safe to run on an existing database.

alter table public.pins add column if not exists pat_count   integer not null default 0;
alter table public.pins add column if not exists hug_count   integer not null default 0;
alter table public.pins add column if not exists agree_count integer not null default 0;

create table if not exists public.pin_reactions (
  pin_id     uuid not null references public.pins(id) on delete cascade,
  voter_id   text not null,
  type       text not null check (type in ('pat', 'hug', 'agree')),
  created_at timestamptz not null default now(),
  primary key (pin_id, voter_id, type)
);
create index if not exists pin_reactions_pin_idx on public.pin_reactions (pin_id);

-- Votes are written/read only by the trusted server route. RLS on + no policy =
-- the public anon/authenticated roles cannot touch the table.
alter table public.pin_reactions enable row level security;

-- Extend the public SELECT grant on pins to include the new tallies (owner_id
-- still excluded). Mirrors setup.sql.
grant select (id, text, lat, lng, mood, is_locked, hint, created_at, expires_at,
              author_name, author_avatar, pat_count, hug_count, agree_count)
  on public.pins to anon, authenticated;
