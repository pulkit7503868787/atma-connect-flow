import { supabase } from "@/lib/supabaseClient";
import { calculateCompatibility, type MatchingUser } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";
import { isPremium } from "@/lib/subscription";

const FREE_DAILY_LIKE_LIMIT = 10;
export type ReceivedRequestsResult = { count: number; users: MatchingUser[] };

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

const isSameAuthUser = async (userId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user && user.id === userId);
};

const getMatchedUserIds = async (userId: string) => {
  const { data, error } = await supabase
    .from("matches")
    .select("user1_id,user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(
    data.map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id))
  );
};

export const hasUserLiked = async (liker_id: string, liked_id: string) => {
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("liker_id", liker_id)
    .eq("liked_id", liked_id)
    .maybeSingle();

  return !error && Boolean(data);
};

export const getSentRequests = async (userId: string): Promise<MatchingUser[]> => {
  if (!(await isSameAuthUser(userId))) {
    return [];
  }

  const [{ data: likesRows, error: likesError }, matchedIds] = await Promise.all([
    supabase.from("likes").select("liked_id").eq("liker_id", userId),
    getMatchedUserIds(userId),
  ]);

  if (likesError || !likesRows?.length) {
    return [];
  }

  const pendingIds = likesRows
    .map((row) => row.liked_id)
    .filter((likedId) => !matchedIds.has(likedId));

  if (!pendingIds.length) {
    return [];
  }

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .in("id", pendingIds)
    .eq("is_blocked", false);

  if (usersError || !usersRows) {
    return [];
  }

  return usersRows.map((row) => normalizeUser(row));
};

export const getReceivedRequests = async (userId: string): Promise<ReceivedRequestsResult> => {
  if (!(await isSameAuthUser(userId))) {
    return { count: 0, users: [] };
  }

  const [{ data: likesRows, error: likesError }, { data: sentRows }, matchedIds] = await Promise.all([
    supabase.from("likes").select("liker_id").eq("liked_id", userId),
    supabase.from("likes").select("liked_id").eq("liker_id", userId),
    getMatchedUserIds(userId),
  ]);

  if (likesError || !likesRows?.length) {
    return { count: 0, users: [] };
  }

  const sentIds = new Set((sentRows ?? []).map((row) => row.liked_id));
  const pendingIds = likesRows
    .map((row) => row.liker_id)
    .filter((likerId) => !matchedIds.has(likerId) && !sentIds.has(likerId));

  if (!pendingIds.length) {
    return { count: 0, users: [] };
  }

  const premium = await isPremium(userId);
  if (!premium) {
    return { count: pendingIds.length, users: [] };
  }

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .in("id", pendingIds)
    .eq("is_blocked", false);

  if (usersError || !usersRows) {
    return { count: pendingIds.length, users: [] };
  }

  return {
    count: pendingIds.length,
    users: usersRows.map((row) => normalizeUser(row)),
  };
};

export const getMatches = async (userId: string): Promise<MatchingUser[]> => {
  if (!(await isSameAuthUser(userId))) {
    return [];
  }

  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select("user1_id,user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (matchError || !matchRows?.length) {
    return [];
  }

  const matchedIds = matchRows.map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id));

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .in("id", matchedIds)
    .eq("is_blocked", false);

  if (usersError || !usersRows) {
    return [];
  }

  return usersRows.map((row) => normalizeUser(row));
};

export const checkMutualMatch = async (userA: string, userB: string) => {
  const [ab, ba] = await Promise.all([hasUserLiked(userA, userB), hasUserLiked(userB, userA)]);
  return ab && ba;
};

export const likeUser = async (liker_id: string, liked_id: string) => {
  if (!liker_id || !liked_id || liker_id === liked_id) {
    return { ok: false, mutualMatch: false, alreadyLiked: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== liker_id) {
    return { ok: false, mutualMatch: false, alreadyLiked: false, reason: "unauthorized" as const };
  }

  const { data: modRows } = await supabase.from("users").select("id,is_blocked").in("id", [liker_id, liked_id]);

  for (const row of modRows ?? []) {
    if (row.is_blocked) {
      return { ok: false, mutualMatch: false, alreadyLiked: false, reason: "blocked" as const };
    }
  }

  const alreadyLiked = await hasUserLiked(liker_id, liked_id);
  if (alreadyLiked) {
    const mutual = await checkMutualMatch(liker_id, liked_id);
    return { ok: true, mutualMatch: mutual, alreadyLiked: true, reason: null };
  }

  const premium = await isPremium(liker_id);
  if (!premium) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("liker_id", liker_id)
      .gte("created_at", startOfDay.toISOString());

    if ((count ?? 0) >= FREE_DAILY_LIKE_LIMIT) {
      return { ok: false, mutualMatch: false, alreadyLiked: false, reason: "limit_reached" as const };
    }
  }

  const { error: likeError } = await supabase.from("likes").insert({ liker_id, liked_id });
  if (likeError) {
    return { ok: false, mutualMatch: false, alreadyLiked: false, reason: "insert_failed" as const };
  }
  await createNotification(liked_id, "like", liker_id);

  const mutualMatch = await checkMutualMatch(liker_id, liked_id);
  if (!mutualMatch) {
    return { ok: true, mutualMatch: false, alreadyLiked: false, reason: null };
  }

  const { data: usersData } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,created_at")
    .in("id", [liker_id, liked_id]);

  const liker = usersData?.find((u) => u.id === liker_id);
  const liked = usersData?.find((u) => u.id === liked_id);
  const compatibility = liker && liked ? calculateCompatibility(normalizeUser(liker), normalizeUser(liked)) : 0;

  const user1_id = liker_id < liked_id ? liker_id : liked_id;
  const user2_id = liker_id < liked_id ? liked_id : liker_id;

  await supabase.from("matches").upsert(
    {
      user1_id,
      user2_id,
      compatibility_score: compatibility,
    },
    { onConflict: "user1_id,user2_id" }
  );
  await createNotification(liker_id, "match", liked_id);
  await createNotification(liked_id, "match", liker_id);

  return { ok: true, mutualMatch: true, alreadyLiked: false, reason: null };
};
