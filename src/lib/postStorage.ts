import { supabase } from "@/lib/supabaseClient";

const BUCKET = "community-posts";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const extFromMime = (mime: string) => {
  const m = mime.toLowerCase();
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "audio/mpeg" || m === "audio/mp3") return "mp3";
  if (m === "audio/wav") return "wav";
  if (m === "audio/webm") return "webm";
  if (m === "audio/ogg") return "ogg";
  if (m === "video/mp4") return "mp4";
  if (m === "video/webm") return "webm";
  if (m === "video/quicktime") return "mov";
  return "bin";
};

const inferMime = (file: File, kind: MediaKind): string => {
  if (file.type) {
    return file.type;
  }
  const n = file.name.toLowerCase();
  if (kind === "audio" && n.endsWith(".mp3")) {
    return "audio/mpeg";
  }
  if (kind === "video" && n.endsWith(".mp4")) {
    return "video/mp4";
  }
  if (kind === "image" && (n.endsWith(".jpg") || n.endsWith(".jpeg"))) {
    return "image/jpeg";
  }
  if (kind === "image" && n.endsWith(".png")) {
    return "image/png";
  }
  if (kind === "image" && n.endsWith(".webp")) {
    return "image/webp";
  }
  return file.type;
};

export const getCommunityPostImagePublicUrl = (path: string) => {
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

export type UploadCommunityPostImageResult = {
  publicUrl: string | null;
  path: string | null;
  error: string | null;
};

export type MediaKind = "image" | "audio" | "video";

export const uploadCommunityMedia = async (
  userId: string,
  file: File,
  kind: MediaKind
): Promise<UploadCommunityPostImageResult> => {
  const types = kind === "image" ? IMAGE_TYPES : kind === "audio" ? AUDIO_TYPES : VIDEO_TYPES;
  const max = kind === "image" ? MAX_IMAGE_BYTES : kind === "audio" ? MAX_AUDIO_BYTES : MAX_VIDEO_BYTES;
  const mime = inferMime(file, kind);
  if (!types.has(mime)) {
    const msg =
      kind === "image"
        ? "Please use JPEG, PNG, or WebP."
        : kind === "audio"
          ? "Please use MP3, WAV, OGG, or WebM audio."
          : "Please use MP4, WebM, or MOV video.";
    return { publicUrl: null, path: null, error: msg };
  }
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    return { publicUrl: null, path: null, error: `File must be ${mb}MB or smaller.` };
  }

  const folder = kind === "image" ? "img" : kind === "audio" ? "audio" : "video";
  const safeExt = extFromMime(mime);
  const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mime,
  });
  if (uploadError) {
    return { publicUrl: null, path: null, error: uploadError.message };
  }
  return { publicUrl: getCommunityPostImagePublicUrl(path), path, error: null };
};

/** @deprecated name kept for Community compose — use uploadCommunityMedia(..., "image") */
export const uploadCommunityPostImage = async (userId: string, file: File): Promise<UploadCommunityPostImageResult> => {
  return uploadCommunityMedia(userId, file, "image");
};
