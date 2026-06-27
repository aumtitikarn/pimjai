-- Pimjai migration — live author name (no more snapshot)
--
-- The name shown on a letter must follow the author's CURRENT profile name, not
-- the value snapshotted into pins.author_name when the letter was created. This
-- view resolves the name live by joining profiles, and the public client reads
-- it instead of the pins table.
--
-- Privacy preserved:
--   • owner_id is NOT exposed (not selected here).
--   • the reveal choice is preserved — author_name stays null for letters the
--     author posted anonymously.
--   • runs with the view owner's privileges (security definer, the default), so
--     anon never needs column access to owner_id for the join.
--
-- Idempotent: drop + recreate (a plain "create or replace" can't reorder/insert
-- columns, only append, so we drop first to keep the column list clean).

drop view if exists public.public_pins;

create view public.public_pins as
select
  p.id, p.text, p.lat, p.lng, p.mood, p.emoji, p.color,
  p.is_locked, p.hint, p.created_at, p.expires_at,
  case
    when p.author_name is not null
      then coalesce(nullif(pr.display_name, ''), p.author_name)
    else null
  end as author_name,
  -- Author bio, live from the profile and only on letters that reveal identity.
  case when p.author_name is not null then nullif(pr.bio, '') else null end as author_bio,
  p.author_avatar,
  p.pat_count, p.hug_count, p.agree_count
from public.pins p
left join public.profiles pr on pr.line_user_id = p.owner_id;

grant select on public.public_pins to anon, authenticated;
