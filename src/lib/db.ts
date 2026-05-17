import p1 from "@/assets/profile-1.jpg";
import p2 from "@/assets/profile-2.jpg";
import p3 from "@/assets/profile-3.jpg";
import p4 from "@/assets/profile-4.jpg";
import { supabase } from "@/lib/supabaseClient";
import { getDiscoveryExcludedUserIds } from "@/lib/discoveryExclude";
import { computeBlendedCompatibilityScore, computeBlendedWithReasons, type CompatibilityInput } from "@/lib/compatibility";

const avatars = [p1, p2, p3, p4];
const locations = ["Rishikesh", "Bangalore", "Pune", "Varanasi", "Mumbai", "Dharamshala"];

/** Columns safe to load for discovery / lists (excludes contact until mutual match RPC). */
export const USERS_PROFILE_SELECT_PUBLIC =
  "id,email,full_name,gender,seeking_gender,age,city,guru,practices,bio,avatar_url,profile_gallery_urls,onboarding_completed,is_blocked,chat_disabled,diet,lifestyle,created_at," +
  "spiritual_path,programs_undergone,sadhana_frequency,spiritual_values,meditation_experience,seva_inclination,guru_notes,guru_photo_url," +
  "marriage_timeline,marital_status,children_preference,relocation_openness,family_orientation," +
  "languages,smoking_habit,drinking_habit,daily_rhythm," +
  "religion,caste,nakshatra,gothram,birth_date,birth_time,birth_place," +
  "occupation,education,income_range,height_cm,family_details,verification_status";

export const USERS_PROFILE_SELECT_SELF = `${USERS_PROFILE_SELECT_PUBLIC},whatsapp_number,call_preference`;

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  gender: string | null;
  seeking_gender: string | null;
  age: number | null;
  city: string | null;
  guru: string | null;
  practices: string[];
  bio: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  is_blocked: boolean;
  chat_disabled: boolean;
  diet: string | null;
  lifestyle: string | null;
  created_at: string;
  spiritual_path: string | null;
  programs_undergone: string[];
  sadhana_frequency: string | null;
  spiritual_values: string[];
  meditation_experience: string | null;
  seva_inclination: string | null;
  guru_notes: string | null;
  guru_photo_url: string | null;
  marriage_timeline: string | null;
  marital_status: string | null;
  children_preference: string | null;
  relocation_openness: string | null;
  family_orientation: string | null;
  languages: string[];
  smoking_habit: string | null;
  drinking_habit: string | null;
  daily_rhythm: string | null;
  religion: string | null;
  caste: string | null;
  nakshatra: string | null;
  gothram: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_place: string | null;
  occupation: string | null;
  education: string | null;
  income_range: string | null;
  height_cm: number | null;
  family_details: string | null;
  verification_status: "unverified" | "pending" | "verified";
  whatsapp_number: string | null;
  call_preference: string | null;
  profile_gallery_urls: string[];
};

export type UserProfileWithCompatibility = UserProfile & {
  compatibility: number;
  match_reasons?: string[];
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
  attachment_url?: string | null;
  attachment_type?: string | null;
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

const strArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]).map(String).filter(Boolean) : []);

const parseHeight = (v: unknown): number | null => {
  if (v === null || v === undefined) {
    return null;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < 100 || n > 250) {
    return null;
  }
  return Math.round(n);
};

const verStatus = (v: unknown): UserProfile["verification_status"] => {
  if (v === "pending" || v === "verified") {
    return v;
  }
  return "unverified";
};

const toUserProfile = (row: Partial<UserProfile> & Record<string, unknown>): UserProfile => ({
  id: row.id ?? "",
  email: row.email ?? "",
  full_name: row.full_name ?? null,
  gender: row.gender ?? null,
  seeking_gender: row.seeking_gender ?? null,
  age: parseAge(row.age),
  city: row.city ?? null,
  guru: row.guru ?? null,
  practices: Array.isArray(row.practices) ? row.practices : [],
  bio: row.bio ?? null,
  avatar_url: row.avatar_url ?? null,
  onboarding_completed: row.onboarding_completed === true,
  is_blocked: row.is_blocked === true,
  chat_disabled: row.chat_disabled === true,
  diet: row.diet ?? null,
  lifestyle: row.lifestyle ?? null,
  created_at: row.created_at ?? new Date().toISOString(),
  spiritual_path: row.spiritual_path != null ? String(row.spiritual_path) : null,
  programs_undergone: strArr(row.programs_undergone),
  sadhana_frequency: row.sadhana_frequency != null ? String(row.sadhana_frequency) : null,
  spiritual_values: strArr(row.spiritual_values),
  meditation_experience: row.meditation_experience != null ? String(row.meditation_experience) : null,
  seva_inclination: row.seva_inclination != null ? String(row.seva_inclination) : null,
  guru_notes: row.guru_notes != null ? String(row.guru_notes) : null,
  guru_photo_url: row.guru_photo_url != null ? String(row.guru_photo_url) : null,
  marriage_timeline: row.marriage_timeline != null ? String(row.marriage_timeline) : null,
  marital_status: row.marital_status != null ? String(row.marital_status) : null,
  children_preference: row.children_preference != null ? String(row.children_preference) : null,
  relocation_openness: row.relocation_openness != null ? String(row.relocation_openness) : null,
  family_orientation: row.family_orientation != null ? String(row.family_orientation) : null,
  languages: strArr(row.languages),
  smoking_habit: row.smoking_habit != null ? String(row.smoking_habit) : null,
  drinking_habit: row.drinking_habit != null ? String(row.drinking_habit) : null,
  daily_rhythm: row.daily_rhythm != null ? String(row.daily_rhythm) : null,
  religion: row.religion != null ? String(row.religion) : null,
  caste: row.caste != null ? String(row.caste) : null,
  nakshatra: row.nakshatra != null ? String(row.nakshatra) : null,
  gothram: row.gothram != null ? String(row.gothram) : null,
  birth_date: row.birth_date != null ? String(row.birth_date) : null,
  birth_time: row.birth_time != null ? String(row.birth_time) : null,
  birth_place: row.birth_place != null ? String(row.birth_place) : null,
  occupation: row.occupation != null ? String(row.occupation) : null,
  education: row.education != null ? String(row.education) : null,
  income_range: row.income_range != null ? String(row.income_range) : null,
  height_cm: parseHeight(row.height_cm),
  family_details: row.family_details != null ? String(row.family_details) : null,
  verification_status: verStatus(row.verification_status),
  whatsapp_number: row.whatsapp_number != null ? String(row.whatsapp_number) : null,
  call_preference: row.call_preference != null ? String(row.call_preference) : null,
  profile_gallery_urls: (() => {
    const raw = row.profile_gallery_urls;
    if (Array.isArray(raw)) {
      return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    }
    return [];
  })(),
});

export { toUserProfile as mapSupabaseUserRow };

const hasText = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

export const isProfileComplete = (profile: UserProfile | null) => {
  if (!profile) {
    return false;
  }

  return (
    hasText(profile.gender) &&
    hasText(profile.seeking_gender) &&
    profile.age != null &&
    hasText(profile.city) &&
    hasText(profile.bio) &&
    hasText(profile.guru) &&
    profile.practices.length > 0 &&
    profile.onboarding_completed
  );
};

/** Curated profile depth for dashboard journey card (0–100). */
export const getProfileCompletionPercent = (profile: UserProfile | null): number => {
  if (!profile) {
    return 0;
  }
  const checks = [
    hasText(profile.gender),
    hasText(profile.seeking_gender),
    profile.age != null,
    hasText(profile.city),
    hasText(profile.bio),
    hasText(profile.guru),
    profile.practices.length > 0,
    profile.onboarding_completed,
    hasText(profile.spiritual_path),
    Boolean(profile.avatar_url?.trim()),
    profile.spiritual_values.length > 0,
    hasText(profile.sadhana_frequency),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
};

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

/** Avatar first, then gallery URLs (for swipeable profile view). */
export const getProfilePhotoUrls = (
  profile: Pick<UserProfile, "id" | "avatar_url" | "profile_gallery_urls">
): string[] => {
  const urls: string[] = [];
  const avatar = profile.avatar_url?.trim();
  if (avatar) urls.push(avatar);
  for (const u of profile.profile_gallery_urls ?? []) {
    const t = u?.trim();
    if (t && !urls.includes(t)) urls.push(t);
  }
  return urls;
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

export const calculateCompatibility = (me: UserProfile, other: UserProfile) =>
  computeBlendedCompatibilityScore(me as CompatibilityInput, other as CompatibilityInput);

export const getCompatibilityWithReasons = (me: UserProfile, other: UserProfile) =>
  computeBlendedWithReasons(me as CompatibilityInput, other as CompatibilityInput);

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.from("users").select(USERS_PROFILE_SELECT_SELF).eq("id", user.id).maybeSingle();

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
    .select(USERS_PROFILE_SELECT_PUBLIC)
    .neq("id", me.id)
    .eq("is_blocked", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const profile = toUserProfile(row);
    const blended = computeBlendedWithReasons(me as CompatibilityInput, profile as CompatibilityInput);
    return {
      ...profile,
      compatibility: blended.score,
      match_reasons: blended.reasons,
    };
  });
};

export const fetchMatchedContactFields = async (
  otherUserId: string
): Promise<{
  whatsapp: string | null;
  callPreference: string | null;
  allowPhoneShare: boolean;
  allowVideoCall: boolean;
}> => {
  const { data, error } = await supabase.rpc("get_matched_contact_fields", { p_other: otherUserId });
  if (error || !data || typeof data !== "object") {
    return { whatsapp: null, callPreference: null, allowPhoneShare: false, allowVideoCall: false };
  }
  const o = data as {
    whatsapp_number?: string | null;
    call_preference?: string | null;
    allow_phone_share?: boolean;
    allow_video_call?: boolean;
  };
  return {
    whatsapp: o.whatsapp_number?.trim() || null,
    callPreference: o.call_preference?.trim() || null,
    allowPhoneShare: Boolean(o.allow_phone_share),
    allowVideoCall: Boolean(o.allow_video_call),
  };
};

/** Swipe / “Suggested” carousels: hide passed users and anyone in an active match or pending request. */
export const getDiscoverySuggestionsExceptRelations = async (): Promise<UserProfileWithCompatibility[]> => {
  const all = await getAllProfilesExceptMe();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }
  const excluded = await getDiscoveryExcludedUserIds(user.id);
  return all.filter((p) => !excluded.has(p.id));
};

const MS_NEWCOMER = 21 * 24 * 60 * 60 * 1000;

/** Recently joined souls (still in discovery), for the Connections hub. */
export const getNewcomerProfilesForViewer = async (): Promise<UserProfileWithCompatibility[]> => {
  const discovery = await getDiscoverySuggestionsExceptRelations();
  const cutoff = Date.now() - MS_NEWCOMER;
  return discovery.filter((p) => {
    const t = Date.parse(p.created_at);
    return Number.isFinite(t) && t >= cutoff;
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
    supabase.from("users").select(USERS_PROFILE_SELECT_PUBLIC).in("id", otherIds),
    supabase
      .from("messages")
      .select("id,chat_id,sender_id,content,created_at,attachment_url,attachment_type")
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

      const lastPreview =
        lastMessage?.content?.trim() ||
        (lastMessage?.attachment_url
          ? lastMessage.attachment_type === "image"
            ? "Shared an image"
            : "Shared a document"
          : null) ||
        "Start your sacred dialogue";

      return {
        ...chat,
        otherUserId,
        name: otherUser ? getDisplayName(otherUser) : "Seeker",
        avatar: otherUser ? getProfilePhotoUrl(otherUser) : getAvatarForId(otherUserId),
        last: lastPreview,
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
    .select("id,chat_id,sender_id,content,created_at,attachment_url,attachment_type")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as ChatMessage[];
};
