import { getPool } from "@/utils/db";

export interface ProfileOverrides {
  displayName: string | null;
  bio: string | null;
}

/**
 * Read a member's editable overrides (custom display name + bio), or null if
 * they've never saved a profile. Server-only — uses the privileged pool.
 */
export async function getProfile(userId: string): Promise<ProfileOverrides | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ display_name: string | null; bio: string | null }>(
    `select display_name, bio from public.profiles where line_user_id = $1`,
    [userId],
  );
  if (rows.length === 0) return null;
  return { displayName: rows[0].display_name, bio: rows[0].bio };
}

/** Insert-or-update a member's profile. Returns the saved overrides. */
export async function upsertProfile(
  userId: string,
  displayName: string | null,
  bio: string | null,
): Promise<ProfileOverrides> {
  const pool = getPool();
  await pool.query(
    `insert into public.profiles (line_user_id, display_name, bio, updated_at)
     values ($1, $2, $3, now())
     on conflict (line_user_id)
     do update set display_name = excluded.display_name,
                   bio = excluded.bio,
                   updated_at = now()`,
    [userId, displayName, bio],
  );
  return { displayName, bio };
}
