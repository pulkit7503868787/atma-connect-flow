import { supabase } from "@/lib/supabaseClient";
import { mapSupabaseUserRow, USERS_PROFILE_SELECT_PUBLIC } from "@/lib/db";
import { calculateCompatibility, type MatchingUser } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";
import { isPremium } from "@/lib/subscription";

const FREE_DAILY_LIKE_LIMIT = 10;
export type ReceivedRequestsResult = { count: number; users: MatchingUser[] };

export type LikeUserResult = {
  ok: boolean;
  mutualMatch: boolean;
  alreadyLiked: boolean;
  reason?: "unauthorized" | "blocked" | "limit_reached" | "insert_failed" | null;
  /** Supabase / PostgREST error message when a write fails */
  error?: string | null;
};

const normalizeUser = (row: Record<string, unknown>): MatchingUser => mapSupabaseUserRow(row);

const orderedPair = (a: string, b: string) => (a < b ? { user1_id: a, user2_id: b } : { user1_id: b, user2_id: a });

const fetchMatchRowForPair = async (a: string, b: string) => {
  const { data, error } = await supabase
    .from("matches")
    .select("id,status,requested_by,user1_id,user2_id")
    .or(`and(user1_id.eq.${a},user2_id.eq.${b}),and(user1_id.eq.${b},user2_id.eq.${a})`)
    .maybeSingle();

  return { data, error };
};

const isSameAuthUser = async (userId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user && user.id === userId);
};

const getMatchedUserIds = async (userId: string) => {
  const { data, error } = await supabase
    .from("matches")
    .select("user1_id,user2_id,status")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(
    data
      .filter((row) => row.status === "matched" || row.status == null)
      .map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id))
  );
};

type MatchPairRow = {
  id: string;
  status: string | null;
  requested_by: string | null;
};

export const hasUserLiked = async (liker_id: string, liked_id: string) => {
  const { data, error } = await fetchMatchRowForPair(liker_id, liked_id);

  if (error || !data) {
    return false;
  }

  if (data.status === "matched" || data.status == null) {
    return true;
  }

  if (data.status === "pending" && data.requested_by === liker_id) {
    return true;
  }

  return false;
};

export const getSentRequests = async (userId: string): Promise<MatchingUser[]> => {
  if (!(await isSameAuthUser(userId))) {
    return [];
  }

  const [{ data: matchRows, error: matchError }, matchedIds] = await Promise.all([
    supabase
      .from("matches")
      .select("user1_id,user2_id,status,requested_by")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    getMatchedUserIds(userId),
  ]);

  if (matchError || !matchRows?.length) {
    return [];
  }

  const pendingIds = matchRows
    .filter((row) => row.status === "pending" && row.requested_by === userId)
    .map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id))
    .filter((otherId) => !matchedIds.has(otherId));

  if (!pendingIds.length) {
    return [];
  }

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
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

  const [{ data: matchRows, error: matchError }, matchedIds] = await Promise.all([
    supabase
      .from("matches")
      .select("user1_id,user2_id,status,requested_by")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    getMatchedUserIds(userId),
  ]);

  if (matchError || !matchRows?.length) {
    return { count: 0, users: [] };
  }

  const myPendingFromOthers = matchRows.filter(
    (row) =>
      row.status === "pending" &&
      row.requested_by != null &&
      row.requested_by !== userId &&
      (row.user1_id === userId || row.user2_id === userId)
  );

  const sentToIds = new Set(
    matchRows
      .filter((row) => row.status === "pending" && row.requested_by === userId)
      .map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id))
  );

  const pendingIds = myPendingFromOthers
    .map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id))
    .filter((likerId) => !matchedIds.has(likerId) && !sentToIds.has(likerId));

  if (!pendingIds.length) {
    return { count: 0, users: [] };
  }

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
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
    .select("user1_id,user2_id,status")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (matchError || !matchRows?.length) {
    return [];
  }

  const matchedIds = matchRows
    .filter((row) => row.status === "matched" || row.status == null)
    .map((row) => (row.user1_id === userId ? row.user2_id : row.user1_id));

  if (!matchedIds.length) {
    return [];
  }

  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .in("id", matchedIds)
    .eq("is_blocked", false);

  if (usersError || !usersRows) {
    return [];
  }

  return usersRows.map((row) => normalizeUser(row));
};

const pairCompatibilityScore = async (userA: string, userB: string): Promise<number> => {
  const { data: usersData } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .in("id", [userA, userB]);

  const liker = usersData?.find((u) => u.id === userA);
  const liked = usersData?.find((u) => u.id === userB);
  if (!liker || !liked) {
    return 0;
  }

  return calculateCompatibility(normalizeUser(liker), normalizeUser(liked));
};

export const checkMutualMatch = async (userA: string, userB: string) => {
  const { data, error } = await fetchMatchRowForPair(userA, userB);

  if (error || !data) {
    return false;
  }

  return data.status === "matched" || data.status == null;
};

export const likeUser = async (liker_id: string, liked_id: string): Promise<LikeUserResult> => {
  const fail = (reason: LikeUserResult["reason"], message?: string | null): LikeUserResult => ({
    ok: false,
    mutualMatch: false,
    alreadyLiked: false,
    reason: reason ?? null,
    error: message ?? null,
  });

  if (!liker_id || !liked_id || liker_id === liked_id) {
    return fail(null);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== liker_id) {
    return fail("unauthorized");
  }

  const { data: modRows } = await supabase.from("users").select("id,is_blocked").in("id", [liker_id, liked_id]);

  for (const row of modRows ?? []) {
    if (row.is_blocked) {
      return fail("blocked");
    }
  }

  const { user1_id, user2_id } = orderedPair(liker_id, liked_id);

  const { data: row, error: rowError } = await fetchMatchRowForPair(liker_id, liked_id);

  if (rowError) {
    return fail("insert_failed", rowError.message);
  }

  const existing = row as MatchPairRow | null;

  if (existing && (existing.status === "matched" || existing.status == null)) {
    return { ok: true, mutualMatch: true, alreadyLiked: true, reason: null, error: null };
  }

  if (existing?.status === "pending") {
    if (existing.requested_by === liker_id) {
      return { ok: true, mutualMatch: false, alreadyLiked: true, reason: null, error: null };
    }

    const compatibility = await pairCompatibilityScore(liker_id, liked_id);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        status: "matched",
        compatibility_score: compatibility,
        requested_by: null,
      })
      .eq("id", existing.id);

    if (updateError) {
      return fail("insert_failed", updateError.message);
    }

    const n1 = await createNotification(liker_id, "match", liked_id);
    const n2 = await createNotification(liked_id, "match", liker_id);
    if (!n1.ok) {
      return fail("insert_failed", n1.error ?? "Could not create notification.");
    }
    if (!n2.ok) {
      return fail("insert_failed", n2.error ?? "Could not create notification.");
    }

    return { ok: true, mutualMatch: true, alreadyLiked: false, reason: null, error: null };
  }

  const premium = await isPremium(liker_id);
  if (!premium) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("requested_by", liker_id)
      .eq("status", "pending")
      .gte("created_at", startOfDay.toISOString());

    if (countError) {
      return fail("insert_failed", countError.message);
    }

    if ((count ?? 0) >= FREE_DAILY_LIKE_LIMIT) {
      return fail("limit_reached");
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("matches")
    .insert({
      user1_id,
      user2_id,
      status: "pending",
      requested_by: liker_id,
      compatibility_score: 0,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    return fail("insert_failed", insertError?.message ?? "Insert failed.");
  }

  const n = await createNotification(liked_id, "like", liker_id);
  if (!n.ok) {
    await supabase.from("matches").delete().eq("id", inserted.id);
    return fail("insert_failed", n.error ?? "Could not create notification.");
  }

  return { ok: true, mutualMatch: false, alreadyLiked: false, reason: null, error: null };
};

/** Recipient accepts an incoming pending request (same outcome as Connect on profile). */
export const acceptIncomingRequest = async (recipientId: string, senderId: string): Promise<LikeUserResult> =>
  likeUser(recipientId, senderId);

export const rejectIncomingRequest = async (
  recipientId: string,
  senderId: string
): Promise<{ ok: boolean; error: string | null }> => {
  if (!(await isSameAuthUser(recipientId))) {
    return { ok: false, error: "Unauthorized." };
  }

  const { data: row, error: fetchError } = await fetchMatchRowForPair(recipientId, senderId);

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!row || row.status !== "pending" || row.requested_by !== senderId) {
    return { ok: false, error: "No pending request from this user." };
  }

  const { error: delError } = await supabase.from("matches").delete().eq("id", row.id);

  if (delError) {
    return { ok: false, error: delError.message };
  }

  // Treat reject like a pass so they move to "Passed souls" and stay out of Discovery.
  await passUser(recipientId, senderId);

  return { ok: true, error: null };
};

/* ───── Pass / Skip tracking ───── */

export const passUser = async (userId: string, passedId: string): Promise<{ ok: boolean; error: string | null }> => {
  if (!userId || !passedId || userId === passedId) {
    return { ok: false, error: "Invalid." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { ok: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("passes")
    .upsert({ user_id: userId, passed_user_id: passedId }, { onConflict: "user_id,passed_user_id" });

  return { ok: !error, error: error?.message ?? null };
};

export const getPassedUserIds = async (userId: string): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from("passes")
    .select("passed_user_id")
    .eq("user_id", userId);

  if (error || !data) {
    return new Set();
  }
  return new Set(data.map((r) => r.passed_user_id));
};

/** Profiles the current user has passed (or declined); for the Passed souls hub section. */
export const getPassedProfilesForUser = async (userId: string): Promise<MatchingUser[]> => {
  if (!(await isSameAuthUser(userId))) {
    return [];
  }
  const ids = Array.from(await getPassedUserIds(userId));
  if (!ids.length) {
    return [];
  }
  const { data: usersRows, error: usersError } = await supabase
    .from("users")
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .in("id", ids)
    .eq("is_blocked", false);

  if (usersError || !usersRows) {
    return [];
  }
  return usersRows.map((row) => normalizeUser(row));
};

/* ───── Super Like ───── */

const FREE_DAILY_SUPER_LIMIT = 1;

export type SuperLikeResult = {
  ok: boolean;
  mutualMatch: boolean;
  error?: string | null;
  reason?: "limit_reached" | "unauthorized" | null;
};

export const superLikeUser = async (liker_id: string, liked_id: string): Promise<SuperLikeResult> => {
  const fail = (reason: SuperLikeResult["reason"], message?: string): SuperLikeResult => ({
    ok: false,
    mutualMatch: false,
    reason: reason ?? null,
    error: message ?? null,
  });

  if (!liker_id || !liked_id || liker_id === liked_id) {
    return fail(null);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== liker_id) {
    return fail("unauthorized");
  }

  const premium = await isPremium(liker_id);
  if (!premium) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from("super_likes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", liker_id)
      .gte("created_at", startOfDay.toISOString());

    if (countError) {
      return fail(null, countError.message);
    }
    if ((count ?? 0) >= FREE_DAILY_SUPER_LIMIT) {
      return fail("limit_reached");
    }
  }

  const { error: insertError } = await supabase
    .from("super_likes")
    .insert({ user_id: liker_id, liked_user_id: liked_id });

  if (insertError) {
    return fail(null, insertError.message);
  }

  const likeResult = await likeUser(liker_id, liked_id);
  return {
    ok: likeResult.ok,
    mutualMatch: likeResult.mutualMatch,
    error: likeResult.error,
    reason: likeResult.reason ?? null,
  };
};
