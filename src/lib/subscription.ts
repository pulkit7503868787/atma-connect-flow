import { supabase } from "@/lib/supabaseClient";

export const isPremium = async (userId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const paid = data.plan === "premium" || data.plan === "moksha";
  return paid && data.status === "active";
};
