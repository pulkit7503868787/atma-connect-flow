import type { UserProfile } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";

/** Self-service profile fields (excludes moderation / identity columns). */
export type ProfileUpdateInput = Partial<
  Omit<UserProfile, "id" | "email" | "is_blocked" | "created_at" | "verification_status" | "chat_disabled">
>;

/** Updates only columns present in `data`. Caller must be authenticated as `userId`. */
export const updateUserProfile = async (
  userId: string,
  data: ProfileUpdateInput
): Promise<{ ok: boolean; error: string | null }> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== userId) {
    return { ok: false, error: "Unauthorized." };
  }

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  if (Object.keys(payload).length === 0) {
    return { ok: true, error: null };
  }

  const { error } = await supabase.from("users").update(payload).eq("id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, error: null };
};
