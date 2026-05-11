import { supabase } from "@/lib/supabaseClient";

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