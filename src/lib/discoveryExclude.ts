import { supabase } from "@/lib/supabaseClient";
import { getShortlistedUserIds } from "@/lib/shortlist";

const isSameAuthUser = async (userId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user && user.id === userId);
};

/** Users to hide from swipe / suggested carousels: passed, matched, pending, or shortlisted. */
export const getDiscoveryExcludedUserIds = async (userId: string): Promise<Set<string>> => {
  if (!(await isSameAuthUser(userId))) {
    return new Set();
  }

  const [{ data: matchRows }, { data: passRows }, shortlistIds] = await Promise.all([
    supabase
      .from("matches")
      .select("user1_id,user2_id,status")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase.from("passes").select("passed_user_id").eq("user_id", userId),
    getShortlistedUserIds(userId),
  ]);

  const excluded = new Set<string>();
  for (const id of shortlistIds) {
    excluded.add(id);
  }
  for (const r of passRows ?? []) {
    if (r.passed_user_id) {
      excluded.add(r.passed_user_id);
    }
  }
  for (const row of matchRows ?? []) {
    const other = row.user1_id === userId ? row.user2_id : row.user1_id;
    if (row.status === "matched" || row.status === "pending") {
      excluded.add(other);
    }
  }
  return excluded;
};
