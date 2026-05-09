import p1 from "@/assets/profile-1.jpg";
import p2 from "@/assets/profile-2.jpg";
import p3 from "@/assets/profile-3.jpg";
import p4 from "@/assets/profile-4.jpg";
import { supabase } from "@/lib/supabaseClient";

const avatars = [p1, p2, p3, p4];
const locations = ["Rishikesh", "Bangalore", "Pune", "Varanasi", "Mumbai", "Dharamshala"];

export type UserProfile = {
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
  chat_disabled: boolean;
  created_at: string;
};

export type UserProfileWithCompatibility = UserProfile & {
  compatibility: number;
};

export type ChatListItem = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  otherUserId: string;
  name: string;
  avatar: string;
  last: string;
  time: string;
  unread: number;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const parseAge = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  const rounded = Math.round(n);
  if (rounded < 13 || rounded > 120) {
    return null;
  }
  return rounded;
};

const toUserProfile = (row: Partial<UserProfile>): UserProfile => ({
  id: row.id ?? "",
  email: row.email ?? "",
  full_name: row.full_name ?? null,
  age: parseAge(row.age),
  city: row.city ?? null,
  guru: row.guru ?? null,
  practices: Array.isArray(row.practices) ? row.practices : [],
  bio: row.bio ?? null,
  avatar_url: row.avatar_url ?? null,
  is_blocked: row.is_blocked === true,
  chat_disabled: row.chat_disabled === true,
  created_at: row.created_at ?? new Date().toISOString(),
});

const indexFromId = (id: string) =>
  id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

export const getAvatarForId = (id: string) => avatars[indexFromId(id) % avatars.length];

export const getLocationForId = (id: string) => locations[indexFromId(id) % locations.length];

export const getAgeForId = (id: string) => 24 + (indexFromId(id) % 11);

/** Uses saved age when set; otherwise deterministic placeholder age. */
export const getProfileAge = (profile: Pick<UserProfile, "id" | "age">) => {
  if (profile.age != null) {
    return profile.age;
  }
  return getAgeForId(profile.id);
};

/** Uses saved city when set; otherwise deterministic placeholder location. */
export const getProfileCity = (profile: Pick<UserProfile, "id" | "city">) => {
  if (profile.city?.trim()) {
    return profile.city.trim();
  }
  return getLocationForId(profile.id);
};

/** Uses uploaded avatar when set; otherwise deterministic placeholder image. */
export const getProfilePhotoUrl = (profile: Pick<UserProfile, "id" | "avatar_url">) => {
  if (profile.avatar_url?.trim()) {
    return profile.avatar_url.trim();
  }
  return getAvatarForId(profile.id);
};

export const getDisplayName = (profile: Pick<UserProfile, "full_name" | "email">) => {
  if (profile.full_name?.trim()) {
    return profile.full_name.trim();
  }

  const emailPrefix = profile.email.split("@")[0];
  return emailPrefix || "Seeker";
};

export const getPrimaryPractice = (practices: string[]) =>
  practices.length ? practices[0] : "Daily Sadhana";

export const calculateCompatibility = (
  me: Pick<UserProfile, "guru" | "practices">,
  other: Pick<UserProfile, "guru" | "practices">
) => {
  let score = 0;
  if (me.guru && other.guru && me.guru === other.guru) {
    score += 50;
  }

  const commonPractices = me.practices.filter((p) => other.practices.includes(p));
  score += commonPractices.length * 10;

  return Math.max(0, Math.min(100, score));
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,chat_disabled,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toUserProfile(data);
};

export const getAllProfilesExceptMe = async (): Promise<UserProfileWithCompatibility[]> => {
  const me = await getCurrentUserProfile();
  if (!me) {
    return [];
  }

  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,chat_disabled,created_at")
    .neq("id", me.id)
    .eq("is_blocked", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const profile = toUserProfile(row);
    return {
      ...profile,
      compatibility: calculateCompatibility(me, profile),
    };
  });
};

export const getChats = async (): Promise<ChatListItem[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: chatRows, error: chatError } = await supabase
    .from("chats")
    .select("id,user1_id,user2_id,created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (chatError || !chatRows?.length) {
    return [];
  }

  const otherIds = chatRows.map((chat) => (chat.user1_id === user.id ? chat.user2_id : chat.user1_id));
  const chatIds = chatRows.map((chat) => chat.id);

  const [{ data: otherUsers }, { data: messageRows }] = await Promise.all([
    supabase
      .from("users")
      .select("id,email,full_name,age,city,guru,practices,bio,avatar_url,is_blocked,chat_disabled,created_at")
      .in("id", otherIds),
    supabase
      .from("messages")
      .select("id,chat_id,sender_id,content,created_at")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false }),
  ]);

  const usersById = new Map((otherUsers ?? []).map((row) => [row.id, toUserProfile(row)]));
  const latestMessageByChat = new Map<string, ChatMessage>();

  for (const row of messageRows ?? []) {
    if (!latestMessageByChat.has(row.chat_id)) {
      latestMessageByChat.set(row.chat_id, row as ChatMessage);
    }
  }

  return chatRows
    .filter((chat) => {
      const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
      const otherUser = usersById.get(otherUserId);
      return !otherUser?.is_blocked;
    })
    .map((chat) => {
      const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
      const otherUser = usersById.get(otherUserId);
      const lastMessage = latestMessageByChat.get(chat.id);
      const dateSource = lastMessage?.created_at ?? chat.created_at;

      return {
        ...chat,
        otherUserId,
        name: otherUser ? getDisplayName(otherUser) : "Seeker",
        avatar: otherUser ? getProfilePhotoUrl(otherUser) : getAvatarForId(otherUserId),
        last: lastMessage?.content ?? "Start your sacred dialogue",
        time: new Date(dateSource).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unread: 0,
      };
    });
};

export const getMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!chat) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id,chat_id,sender_id,content,created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as ChatMessage[];
};
