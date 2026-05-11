import { supabase } from "@/lib/supabaseClient";
import { getDisplayName, getProfilePhotoUrl, type UserProfile } from "@/lib/db";
import { getCommunityPostImagePublicUrl } from "@/lib/postStorage";

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string;
  liked_by_me: boolean;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
};

const enrichPosts = async (rows: { id: string; user_id: string; content: string; image_url: string | null; likes_count: number; comments_count: number; created_at: string }[], currentUserId?: string): Promise<Post[]> => {
  if (!rows.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  let likedPostIds = new Set<string>();
  if (currentUserId) {
    const { data: myLikes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", currentUserId);
    likedPostIds = new Set((myLikes ?? []).map((l) => l.post_id));
  }

  return rows.map((row) => {
    const u = userMap.get(row.user_id);
    const imageUrl = row.image_url?.trim()
      ? row.image_url.trim().startsWith("http")
        ? row.image_url.trim()
        : getCommunityPostImagePublicUrl(row.image_url.trim())
      : null;
    return {
      ...row,
      image_url: imageUrl,
      author_name: u ? getDisplayName(u as UserProfile) : "Seeker",
      author_avatar: u ? getProfilePhotoUrl(u as unknown as Pick<UserProfile, "id" | "avatar_url">) : "",
      liked_by_me: likedPostIds.has(row.id),
    };
  });
};

export const getPosts = async (currentUserId?: string): Promise<Post[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,content,image_url,likes_count,comments_count,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return enrichPosts(data, currentUserId);
};

export const createPost = async (content: string, imageUrl?: string | null): Promise<{ ok: boolean; post?: Post; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const trimmed = content.trim();
  const body = trimmed || (imageUrl ? "Shared with the sangha." : "");
  if (!body && !imageUrl) {
    return { ok: false, error: "Write something or add an image." };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, content: body, image_url: imageUrl ?? null })
    .select("id,user_id,content,image_url,likes_count,comments_count,created_at")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create post" };

  const enriched = await enrichPosts([data], user.id);
  return { ok: true, post: enriched[0] };
};

export const toggleLikePost = async (postId: string): Promise<{ ok: boolean; liked: boolean; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, liked: false, error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_likes").delete().eq("id", existing.id);
    await supabase.rpc("decrement_post_likes", { post_id: postId });
    return { ok: true, liked: false };
  }

  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
  if (error) return { ok: false, liked: false, error: error.message };

  await supabase.rpc("increment_post_likes", { post_id: postId });
  return { ok: true, liked: true };
};

export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,post_id,user_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: users } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url")
    .in("id", userIds);

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

export const addComment = async (postId: string, content: string): Promise<{ ok: boolean; comment?: PostComment; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: user.id, content: content.trim() })
    .select("id,post_id,user_id,content,created_at")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to add comment" };

  await supabase.rpc("increment_post_comments", { post_id: postId });

  return {
    ok: true,
    comment: {
      ...data,
      author_name: "You",
      author_avatar: "",
    },
  };
};