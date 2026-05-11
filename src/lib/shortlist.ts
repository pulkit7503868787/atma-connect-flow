import { supabase } from "@/lib/supabaseClient";
import { USERS_PROFILE_SELECT_PUBLIC } from "@/lib/db";
import { normalizeMatchingUserRow, type MatchingUser } from "@/lib/matching";

export const getShortlistedUserIds = async (ownerId: string): Promise<Set<string>> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) {
    return new Set();
  }
  const { data, error } = await supabase.from("user_shortlist").select("profile_id").eq("owner_id", ownerId);
  if (error) {
    return new Set();
  }
  if (!data) {
    return new Set();
  }
  return new Set(data.map((r) => r.profile_id).filter(Boolean));
};

export const getShortlistedProfiles = async (ownerId: string): Promise<MatchingUser[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) {
    return [];
  }
  const ids = Array.from(await getShortlistedUserIds(ownerId));
  if (!ids.length) {
    return [];
  }
  const { data, error } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .in("id", ids)
    .eq("is_blocked", false);
  if (error) {
    return [];
  }
  if (!data) {
    return [];
  }
  return data.map((row) => normalizeMatchingUserRow(row as Record<string, unknown>));
};

export const addToShortlist = async (ownerId: string, profileId: string): Promise<{ ok: boolean; error: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) {
    return { ok: false, error: "Unauthorized." };
  }
  if (!profileId || ownerId === profileId) {
    return { ok: false, error: "Invalid." };
  }
  const { error } = await supabase.from("user_shortlist").insert({ owner_id: ownerId, profile_id: profileId });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
};

export const removeFromShortlist = async (ownerId: string, profileId: string): Promise<{ ok: boolean; error: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) {
    return { ok: false, error: "Unauthorized." };
  }
  const { error } = await supabase.from("user_shortlist").delete().eq("owner_id", ownerId).eq("profile_id", profileId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
};
