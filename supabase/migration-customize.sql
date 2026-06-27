-- Pimjai migration — per-letter custom emoji & colour
--
-- Lets an author personalise a letter beyond the three mood presets:
--   • emoji — a free emoji shown on the map pin and in the popup header
--   • color — a free hex background colour used by the pin bubble and share card
-- Both are nullable; existing letters simply fall back to their mood's default
-- in the app, so this is fully backward compatible.
--
-- Idempotent: safe to run on an existing database.

alter table public.pins add column if not exists emoji text;
alter table public.pins add column if not exists color text;

-- Re-grant the public SELECT column list to include the new columns (owner_id
-- still deliberately excluded). Mirrors setup.sql + earlier migrations.
grant select (id, text, lat, lng, mood, is_locked, hint, created_at, expires_at,
              author_name, author_avatar, pat_count, hug_count, agree_count,
              emoji, color)
  on public.pins to anon, authenticated;
