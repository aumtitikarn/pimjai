-- Pimjai migration — let authors choose identity & lifetime
--
-- Adds public author attribution columns so a signed-in user can opt to reveal
-- their LINE name + avatar on a letter. owner_id stays private and continues to
-- drive delete control; these columns are the public, opt-in display identity.
-- The 24h lifetime is now a per-letter choice (see POST /api/pins), not derived
-- from auth state — no schema change needed for that, expires_at already exists.
--
-- Idempotent: safe to run on an existing database.

alter table public.pins add column if not exists author_name   text;
alter table public.pins add column if not exists author_avatar text;

-- Re-grant the public SELECT column list to include the new columns (owner_id
-- still deliberately excluded). Mirrors setup.sql.
grant select (id, text, lat, lng, mood, is_locked, hint, created_at, expires_at,
              author_name, author_avatar)
  on public.pins to anon, authenticated;
