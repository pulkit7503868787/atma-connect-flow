import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/notifications";

export type DbMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export const createOrGetChat = async (user1_id: string, user2_id: string) => {
  if (!user1_id || !user2_id || user1_id === user2_id) {
    return null;
  }

  const { data: existing } = await supabase
    .from("chats")
    .select("id")
    .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("chats")
    .insert({ user1_id, user2_id })
    .select("id")
    .single();

  if (error || !created) {
    return null;
  }

  return created.id;
};

export type SendMessageResult =
  | { ok: true; message: DbMessage }
  | { ok: false };

export const sendMessage = async (chat_id: string, sender_id: string, content: string): Promise<SendMessageResult> => {
  const body = content.trim();
  if (!chat_id || !sender_id || !body) {
    return { ok: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== sender_id) {
    return { ok: false };
  }

  const { data: modFlags } = await supabase.from("users").select("chat_disabled").eq("id", sender_id).maybeSingle();

  if (modFlags?.chat_disabled) {
    return { ok: false };
  }

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      chat_id,
      sender_id,
      content: body,
    })
    .select("id,chat_id,sender_id,content,created_at")
    .single();

  if (error || !inserted) {
    return { ok: false };
  }

  const row = inserted as DbMessage;

  const { data: chatRow } = await supabase
    .from("chats")
    .select("user1_id,user2_id")
    .eq("id", chat_id)
    .maybeSingle();

  const receiverId = chatRow
    ? chatRow.user1_id === sender_id
      ? chatRow.user2_id
      : chatRow.user1_id
    : null;

  if (receiverId) {
    await createNotification(receiverId, "message", chat_id);
  }

  return { ok: true, message: row };
};

export const getMessages = async (chat_id: string): Promise<DbMessage[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select("id,chat_id,sender_id,content,created_at")
    .eq("chat_id", chat_id)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as DbMessage[];
};

export const subscribeToMessages = (chat_id: string, callback: (newMessage: DbMessage) => void): RealtimeChannel => {
  const channelName = `messages:${chat_id}:${crypto.randomUUID()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chat_id}`,
      },
      (payload) => {
        callback(payload.new as DbMessage);
      }
    )
    .subscribe();

  return channel;
};
