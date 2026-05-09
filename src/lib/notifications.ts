import { supabase } from "@/lib/supabaseClient";

export type NotificationType = "like" | "match" | "message";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  seen: boolean;
  created_at: string;
};

const isSameAuthUser = async (userId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user && user.id === userId);
};

export const createNotification = async (
  userId: string,
  type: NotificationType,
  referenceId: string | null
) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    reference_id: referenceId,
  });

  return !error;
};

export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  if (!(await isSameAuthUser(userId))) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,user_id,type,reference_id,seen,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AppNotification[];
};

export const getUnseenNotificationCount = async (userId: string) => {
  if (!(await isSameAuthUser(userId))) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("seen", false);

  if (error) {
    return 0;
  }

  return count ?? 0;
};

export const markNotificationsSeen = async (userId: string) => {
  if (!(await isSameAuthUser(userId))) {
    return false;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ seen: true })
    .eq("user_id", userId)
    .eq("seen", false);

  return !error;
};
