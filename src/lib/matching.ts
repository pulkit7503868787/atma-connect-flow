import { supabase } from "@/lib/supabaseClient";
import { calculateAISpiritualCompatibility } from "@/lib/aiMatching";
import { mapSupabaseUserRow, USERS_PROFILE_SELECT_PUBLIC, type UserProfile } from "@/lib/db";
import { computeBlendedCompatibilityScore, computeBlendedWithReasons, computeStructuredCompatibility, type CompatibilityInput } from "@/lib/compatibility";

export type MatchingUser = UserProfile;

export type RankedMatch = MatchingUser & {
  compatibility: number;
  finalCompatibilityScore: number;
  baseCompatibility: number;
  aiSpiritualScore: number;
  matchReasons: string[];
};

export const normalizeMatchingUserRow = (row: Record<string, unknown>): MatchingUser => mapSupabaseUserRow(row);

export { computeBlendedCompatibilityScore as calculateCompatibility } from "@/lib/compatibility";

const rankPair = (currentUser: MatchingUser, user: MatchingUser): RankedMatch => {
  const structured = computeStructuredCompatibility(currentUser as CompatibilityInput, user as CompatibilityInput);
  const ai = calculateAISpiritualCompatibility(currentUser, user);
  const blended = computeBlendedWithReasons(currentUser as CompatibilityInput, user as CompatibilityInput);

  return {
    ...user,
    compatibility: blended.score,
    finalCompatibilityScore: blended.score,
    baseCompatibility: structured.score,
    aiSpiritualScore: ai.aiScore,
    matchReasons: blended.reasons,
  };
};

export const getMatchesForUser = async (currentUser: MatchingUser): Promise<RankedMatch[]> => {
  const { data, error } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .neq("id", currentUser.id)
    .eq("is_blocked", false);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => {
      const user = normalizeMatchingUserRow(row as Record<string, unknown>);
      return rankPair(currentUser, user);
    })
    .sort((a, b) => b.finalCompatibilityScore - a.finalCompatibilityScore);
};

export const getConfirmedMatchesForUser = async (currentUser: MatchingUser): Promise<RankedMatch[]> => {
  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("user1_id,user2_id,compatibility_score,status")
    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
    .order("compatibility_score", { ascending: false });

  if (matchError || !matchRows?.length) {
    return [];
  }

  const confirmedRows = matchRows.filter((row) => row.status === "matched" || row.status == null);

  if (!confirmedRows.length) {
    return [];
  }

  const otherUserIds = confirmedRows.map((row) =>
    row.user1_id === currentUser.id ? row.user2_id : row.user1_id
  );

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .in("id", otherUserIds);

  if (usersError || !usersData) {
    return [];
  }

  const usersById = new Map(usersData.map((row) => [row.id, normalizeMatchingUserRow(row as Record<string, unknown>)]));

  return confirmedRows
    .map((row) => {
      const otherUserId = row.user1_id === currentUser.id ? row.user2_id : row.user1_id;
      const user = usersById.get(otherUserId);
      if (!user || user.is_blocked) {
        return null;
      }

      return rankPair(currentUser, user);
    })
    .filter((item): item is RankedMatch => Boolean(item))
    .sort((a, b) => b.finalCompatibilityScore - a.finalCompatibilityScore);
};
