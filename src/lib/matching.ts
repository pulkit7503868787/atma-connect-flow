import { supabase } from "@/lib/supabaseClient";
import { calculateAISpiritualCompatibility, computeFinalCompatibilityScore } from "@/lib/aiMatching";

export type MatchingUser = {
  id: string;
  email: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  guru: string | null;
  practices: string[];
  bio: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  created_at: string;
};

export type RankedMatch = MatchingUser & {
  /** Final blended score (same as `finalCompatibilityScore`; used across UI). */
  compatibility: number;
  finalCompatibilityScore: number;
  baseCompatibility: number;
  aiSpiritualScore: number;
  matchReasons: string[];
};

const normalizeUser = (row: Partial<MatchingUser>): MatchingUser => ({
  id: row.id ?? "",
  email: row.email ?? "",
  full_name: row.full_name ?? null,
  age: row.age != null && Number.isFinite(Number(row.age)) ? Math.round(Number(row.age)) : null,
  city: row.city ?? null,
  guru: row.guru ?? null,
  practices: Array.isArray(row.practices) ? row.practices : [],
  bio: row.bio ?? null,
  avatar_url: row.avatar_url ?? null,
  is_blocked: row.is_blocked === true,
  created_at: row.created_at ?? new Date().toISOString(),
});

export const calculateCompatibility = (
  userA: Pick<MatchingUser, "guru" | "practices">,
  userB: Pick<MatchingUser, "guru" | "practices">
) => {
  let score = 0;

  if (userA.guru && userB.guru && userA.guru === userB.guru) {
    score += 50;
  }

  const commonCount = userA.practices.filter((practice) => userB.practices.includes(practice)).length;
  score += commonCount * 10;

  if (commonCount >= 3) {
    score += 10;
  }

  return Math.min(score, 100);
};

const rankPair = (currentUser: MatchingUser, user: MatchingUser): RankedMatch => {
  const baseCompatibility = calculateCompatibility(currentUser, user);
  const ai = calculateAISpiritualCompatibility(currentUser, user);
  const finalCompatibilityScore = computeFinalCompatibilityScore(baseCompatibility, ai.aiScore);

  return {
    ...user,
    compatibility: finalCompatibilityScore,
    finalCompatibilityScore,
    baseCompatibility,
    aiSpiritualScore: ai.aiScore,
    matchReasons: ai.reasons,
  };
};

export const getMatchesForUser = async (currentUser: MatchingUser): Promise<RankedMatch[]> => {
  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .neq("id", currentUser.id)
    .eq("is_blocked", false);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => {
      const user = normalizeUser(row);
      return rankPair(currentUser, user);
    })
    .sort((a, b) => b.finalCompatibilityScore - a.finalCompatibilityScore);
};

export const getConfirmedMatchesForUser = async (currentUser: MatchingUser): Promise<RankedMatch[]> => {
  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("user1_id,user2_id,compatibility_score")
    .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
    .order("compatibility_score", { ascending: false });

  if (matchError || !matchRows?.length) {
    return [];
  }

  const otherUserIds = matchRows.map((row) =>
    row.user1_id === currentUser.id ? row.user2_id : row.user1_id
  );

  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .in("id", otherUserIds);

  if (usersError || !usersData) {
    return [];
  }

  const usersById = new Map(usersData.map((row) => [row.id, normalizeUser(row)]));

  return matchRows
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
