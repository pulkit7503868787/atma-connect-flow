import { supabase } from "@/lib/supabaseClient";
import { getDisplayName, getProfilePhotoUrl, type UserProfile } from "@/lib/db";
import { getCommunityPostImagePublicUrl } from "@/lib/postStorage";

/** Stored on `posts.category`. Legacy `teaching` rows are read as `meditation_audio`. */
export type PostCategory = "reflection" | "satsang_experience" | "meditation_audio" | "gathering_invitation";

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  reflection: "Post",
  satsang_experience: "Satsang / Experience Sharing",
  meditation_audio: "Sadhana / Yoga / Teaching updates",
  gathering_invitation: "Event / Gathering invitation",
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  category: PostCategory;
  image_url: string | null;
  image_urls: string[];
  audio_url: string | null;
  video_url: string | null;
  event_title: string | null;
  event_starts_at: string | null;
  event_location: string | null;
  event_link: string | null;
  cover_image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string;
  liked_by_me: boolean;
};

/** Event block + cover: new gatherings, or older `satsang_experience` rows that still carry event fields. */
export const postUsesGatheringFields = (p: Pick<Post, "category" | "event_title" | "event_starts_at">): boolean =>
  p.category === "gathering_invitation" ||
  (p.category === "satsang_experience" && (Boolean(p.event_title?.trim()) || Boolean(p.event_starts_at)));

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
};

type PostRow = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  category?: string | null;
  image_urls?: unknown;
  audio_url?: string | null;
  video_url?: string | null;
  event_title?: string | null;
  event_starts_at?: string | null;
  event_location?: string | null;
  event_link?: string | null;
  cover_image_url?: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

const resolveStoredUrl = (raw: string | null | undefined): string | null => {
  const s = raw?.trim();
  if (!s) {
    return null;
  }
  return s.startsWith("http") ? s : getCommunityPostImagePublicUrl(s);
};

const parseCategory = (v: string | null | undefined): PostCategory => {
  const legacyMap: Record<string, PostCategory> = {
    reflection: "reflection",
    satsang_experience: "satsang_experience",
    meditation_audio: "meditation_audio",
    gathering_invitation: "gathering_invitation",
    teaching: "meditation_audio",
    satsang: "satsang_experience",
    event: "gathering_invitation",
    chanting: "reflection",
  };
  if (v && legacyMap[v]) {
    return legacyMap[v];
  }
  return "reflection";
};

const mergeImageUrls = (row: PostRow): string[] => {
  const raw = row.image_urls;
  const fromJson = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
  const legacy = row.image_url?.trim();
  if (!legacy) {
    return fromJson;
  }
  if (!fromJson.length) {
    return [legacy];
  }
  return fromJson.includes(legacy) ? fromJson : [legacy, ...fromJson];
};

const enrichPosts = async (rows: PostRow[], currentUserId?: string): Promise<Post[]> => {
  if (!rows.length) {
    return [];
  }

  let hiddenAuthors = new Set<string>();
  if (currentUserId) {
    const { data: hides } = await supabase.from("post_feed_hides").select("hidden_author_id").eq("viewer_id", currentUserId);
    hiddenAuthors = new Set((hides ?? []).map((h) => h.hidden_author_id));
  }

  const visible = rows.filter((r) => !hiddenAuthors.has(r.user_id));

  const userIds = [...new Set(visible.map((r) => r.user_id))];
  const { data: users } = await supabase.from("users").select("id,email,full_name,avatar_url").in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  let likedPostIds = new Set<string>();
  if (currentUserId) {
    const { data: myLikes } = await supabase.from("post_likes").select("post_id").eq("user_id", currentUserId);
    likedPostIds = new Set((myLikes ?? []).map((l) => l.post_id));
  }

  return visible.map((row) => {
    const u = userMap.get(row.user_id);
    const mergedPaths = mergeImageUrls(row);
    const image_urls = mergedPaths.map((p) => resolveStoredUrl(p) ?? "").filter(Boolean);
    const primaryLegacy = row.image_url?.trim()
      ? resolveStoredUrl(row.image_url.trim())
      : image_urls[0] ?? null;

    return {
      id: row.id,
      user_id: row.user_id,
      content: row.content,
      category: parseCategory(row.category),
      image_url: primaryLegacy,
      image_urls: image_urls.length ? image_urls : primaryLegacy ? [primaryLegacy] : [],
      audio_url: resolveStoredUrl(row.audio_url),
      video_url: resolveStoredUrl(row.video_url),
      event_title: row.event_title?.trim() || null,
      event_starts_at: row.event_starts_at ?? null,
      event_location: row.event_location?.trim() || null,
      event_link: row.event_link?.trim() || null,
      cover_image_url: resolveStoredUrl(row.cover_image_url),
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      created_at: row.created_at,
      author_name: u ? getDisplayName(u as UserProfile) : "Seeker",
      author_avatar: u ? getProfilePhotoUrl(u as unknown as Pick<UserProfile, "id" | "avatar_url">) : "",
      liked_by_me: likedPostIds.has(row.id),
    };
  });
};

const POST_SELECT =
  "id,user_id,content,image_url,category,image_urls,audio_url,video_url,event_title,event_starts_at,event_location,event_link,cover_image_url,likes_count,comments_count,created_at";

export const getPosts = async (currentUserId?: string): Promise<Post[]> => {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(50);

  if (error || !data) {
    return [];
  }
  return enrichPosts(data as PostRow[], currentUserId);
};

export const hidePostsFromAuthor = async (authorId: string): Promise<{ ok: boolean; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  if (authorId === user.id) {
    return { ok: false, error: "Cannot hide your own posts this way." };
  }
  const { error } = await supabase.from("post_feed_hides").insert({ viewer_id: user.id, hidden_author_id: authorId });
  if (error && error.code !== "23505") {
    return { ok: false, error: error.message };
  }
  return { ok: true };
};

export const unhidePostsFromAuthor = async (authorId: string): Promise<{ ok: boolean; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  const { error } = await supabase.from("post_feed_hides").delete().eq("viewer_id", user.id).eq("hidden_author_id", authorId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
};

export type CreatePostPayload = {
  content: string;
  category: PostCategory;
  imagePaths: string[];
  audioPath?: string | null;
  videoPath?: string | null;
  eventTitle?: string | null;
  eventStartsAt?: string | null;
  eventLocation?: string | null;
  eventLink?: string | null;
  coverImagePath?: string | null;
};

export const createPost = async (payload: CreatePostPayload): Promise<{ ok: boolean; post?: Post; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const trimmed = payload.content.trim();
  const paths = payload.imagePaths.filter(Boolean);
  const firstPath = paths[0] ?? null;
  const hasMedia = Boolean(
    firstPath || paths.length || payload.audioPath || payload.videoPath || payload.coverImagePath
  );
  const hasEvent = Boolean(payload.eventTitle?.trim() && payload.eventStartsAt);

  let body = trimmed;
  if (!body && hasEvent) {
    body = payload.eventTitle?.trim() ?? "Gathering";
  }
  if (!body && hasMedia) {
    body = "Shared with the sangha.";
  }
  if (!body) {
    return { ok: false, error: "Write something or add media." };
  }

  const insertRow: Record<string, unknown> = {
    user_id: user.id,
    content: body,
    category: payload.category,
    image_url: firstPath,
    image_urls: paths.length ? paths : firstPath ? [firstPath] : [],
    audio_url: payload.audioPath ?? null,
    video_url: payload.videoPath ?? null,
    event_title: payload.eventTitle?.trim() || null,
    event_starts_at: payload.eventStartsAt || null,
    event_location: payload.eventLocation?.trim() || null,
    event_link: payload.eventLink?.trim() || null,
    cover_image_url: payload.coverImagePath ?? null,
  };

  const { data, error } = await supabase.from("posts").insert(insertRow).select(POST_SELECT).single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to create post" };
  }

  const enriched = await enrichPosts([data as PostRow], user.id);
  return { ok: true, post: enriched[0] };
};

export const toggleLikePost = async (postId: string): Promise<{ ok: boolean; liked: boolean; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, liked: false, error: "Unauthorized" };
  }

  const { data: existing } = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase.from("post_likes").delete().eq("id", existing.id);
    if (delErr) {
      return { ok: false, liked: true, error: delErr.message };
    }
    return { ok: true, liked: false };
  }

  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  if (error) {
    return { ok: false, liked: false, error: error.message };
  }

  return { ok: true, liked: true };
};

/** Refresh counts from server after like (triggers maintain posts.likes_count). */
export const getPostLikeSnapshot = async (
  postId: string,
  currentUserId?: string
): Promise<{ likes_count: number; liked_by_me: boolean } | null> => {
  const { data: row, error } = await supabase.from("posts").select("likes_count").eq("id", postId).maybeSingle();
  if (error || !row) {
    return null;
  }
  let liked = false;
  if (currentUserId) {
    const { data: lk } = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", currentUserId).maybeSingle();
    liked = Boolean(lk);
  }
  return { likes_count: row.likes_count, liked_by_me: liked };
};

export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,post_id,user_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: users } = await supabase.from("users").select("id,email,full_name,avatar_url").in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  return data.map((row) => {
    const u = userMap.get(row.user_id);
    return {
      ...row,
      author_name: u ? getDisplayName(u as UserProfile) : "Seeker",
      author_avatar: u ? getProfilePhotoUrl(u as unknown as Pick<UserProfile, "id" | "avatar_url">) : "",
    };
  });
};

export const addComment = async (
  postId: string,
  content: string
): Promise<{ ok: boolean; comment?: PostComment; comments_count?: number; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: user.id, content: content.trim() })
    .select("id,post_id,user_id,content,created_at")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to add comment" };
  }

  const [{ data: u }, { data: postRow }] = await Promise.all([
    supabase.from("users").select("id,email,full_name,avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("posts").select("comments_count").eq("id", postId).maybeSingle(),
  ]);

  return {
    ok: true,
    comments_count: postRow?.comments_count,
    comment: {
      ...data,
      author_name: u ? getDisplayName(u as UserProfile) : "Seeker",
      author_avatar: u ? getProfilePhotoUrl(u as unknown as Pick<UserProfile, "id" | "avatar_url">) : "",
    },
  };
};
