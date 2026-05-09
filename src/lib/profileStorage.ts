import { supabase } from "@/lib/supabaseClient";

const BUCKET = "profile-images";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extFromMime = (mime: string) => {
  if (mime === "image/jpeg") {
    return "jpg";
  }
  if (mime === "image/png") {
    return "png";
  }
  if (mime === "image/webp") {
    return "webp";
  }
  return "bin";
};

export const getPublicImageUrl = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(trimmed);
  return data.publicUrl;
};

export type UploadProfileImageResult = {
  publicUrl: string | null;
  path: string | null;
  error: string | null;
};

/** Validates file, uploads to `profile-images/{userId}/…`, returns public URL for storing on `users.avatar_url`. */
export const uploadProfileImage = async (userId: string, file: File): Promise<UploadProfileImageResult> => {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { publicUrl: null, path: null, error: "Please use JPEG, PNG, or WebP." };
  }

  if (file.size > MAX_BYTES) {
    return { publicUrl: null, path: null, error: "Image must be 2MB or smaller." };
  }

  const safeExt = extFromMime(file.type);
  const path = `${userId}/${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    return { publicUrl: null, path: null, error: uploadError.message };
  }

  const publicUrl = getPublicImageUrl(path);
  return { publicUrl, path, error: null };
};
