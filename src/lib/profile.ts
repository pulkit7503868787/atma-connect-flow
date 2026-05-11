import { supabase } from "@/lib/supabaseClient";

export type ProfileUpdateInput = Partial<{
  full_name: string | null;
  gender: string | null;
  seeking_gender: string | null;
  age: number | null;
  city: string | null;
  bio: string | null;
  guru: string | null;
  practices: string[];
  avatar_url: string | null;
  onboarding_completed: boolean;
  diet: string | null;
  lifestyle: string | null;
}>;

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
