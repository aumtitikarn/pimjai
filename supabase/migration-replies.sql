-- Pimjai migration — public replies on letters
--
-- A signed-in member can leave a public reply (comment) under any letter. Replies
-- mirror the pins identity model:
--   • owner_id (a LINE userId) is PRIVATE — it drives delete control and lets us
--     skip self-notifications. Never exposed to the public client.
--   • author_name / author_avatar are the opt-in public attribution. They are set
--     only when the replier chooses to reveal their identity; null = anonymous.
--
-- Replies are plain text (never encrypted — unlike locked letters, a comment is
-- public by nature).
--
-- Idempotent: safe to run on an existing database.

create table if not exists public.pin_replies (
  id            uuid primary key default gen_random_uuid(),
  pin_id        uuid not null references public.pins(id) on delete cascade,
  text          text not null check (char_length(text) between 1 and 2000),
  owner_id      text,                 -- LINE userId of the replier (private)
  author_name   text check (char_length(author_name) <= 40),
  author_avatar text,
  created_at    timestamptz not null default now()
);

create index if not exists pin_replies_pin_idx
  on public.pin_replies (pin_id, created_at);

-- Live public view: resolves the author's CURRENT profile name (like public_pins),
-- and never exposes owner_id. Runs with the view owner's privileges (security
-- definer, the default), so anon never needs column access to owner_id for the join.
drop view if exists public.public_pin_replies;

create view public.public_pin_replies as
select
  r.id,
  r.pin_id,
  r.text,
  case
    when r.author_name is not null
      then coalesce(nullif(pr.display_name, ''), r.author_name)
    else null
  end as author_name,
  r.author_avatar,
  r.created_at
from public.pin_replies r
left join public.profiles pr on pr.line_user_id = r.owner_id;

grant select on public.public_pin_replies to anon, authenticated;

-- The base table is written exclusively by the trusted server routes (privileged
-- DATABASE_URL connection), so RLS stays enabled with no public policies — anon /
-- authenticated read replies through the view above, not the table.
alter table public.pin_replies enable row level security;

-- Notifications now carry a 'reply' kind in addition to the three reaction kinds.
-- Relax the existing CHECK so a reply ping can be recorded.
alter table public.notifications drop constraint if exists notifications_reaction_check;
alter table public.notifications
  add constraint notifications_reaction_check
  check (reaction in ('pat', 'hug', 'agree', 'reply'));
