import { supabase } from "@/lib/supabaseClient";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_blocked: boolean;
  chat_disabled: boolean;
  created_at: string;
};

export type AdminSubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AdminMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export const checkIsAdmin = async (): Promise<boolean> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

  return !error && Boolean(data);
};

export const listUsersForAdmin = async (): Promise<AdminUserRow[]> => {
  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,is_blocked,chat_disabled,created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AdminUserRow[];
};

export const listSubscriptionsForAdmin = async (): Promise<AdminSubscriptionRow[]> => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id,user_id,plan,status,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AdminSubscriptionRow[];
};

export const listRecentMessagesForAdmin = async (limit = 80): Promise<AdminMessageRow[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select("id,chat_id,sender_id,content,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data as AdminMessageRow[];
};

export const setUserBlocked = async (userId: string, is_blocked: boolean): Promise<{ ok: boolean; error: string | null }> => {
  const { error } = await supabase.from("users").update({ is_blocked }).eq("id", userId);
  return { ok: !error, error: error?.message ?? null };
};

export const setUserChatDisabled = async (userId: string, chat_disabled: boolean): Promise<{ ok: boolean; error: string | null }> => {
  const { error } = await supabase.from("users").update({ chat_disabled }).eq("id", userId);
  return { ok: !error, error: error?.message ?? null };
};

export const deleteMessageAsAdmin = async (messageId: string): Promise<{ ok: boolean; error: string | null }> => {
  const { error } = await supabase.from("messages").delete().eq("id", messageId);
  return { ok: !error, error: error?.message ?? null };
};
