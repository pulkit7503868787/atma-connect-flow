import { supabase } from "@/lib/supabaseClient";

const BUCKET = "chat-media";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_FILE = 15 * 1024 * 1024;

export type ChatAttachmentKind = "image" | "file";

export const getChatAttachmentPublicUrl = (pathOrUrl: string | null | undefined): string => {
  const s = pathOrUrl?.trim();
  if (!s) {
    return "";
  }
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(s);
  return data.publicUrl;
};

export const uploadChatAttachment = async (
  userId: string,
  chatId: string,
  file: File
): Promise<{ path: string | null; attachment_type: ChatAttachmentKind | null; error: string | null }> => {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) {
    return { path: null, attachment_type: null, error: "Please choose an image or PDF." };
  }
  const max = isImage ? MAX_IMAGE : MAX_FILE;
  if (file.size > max) {
    return { path: null, attachment_type: null, error: "File is too large for this chat." };
  }

  const safeExt = isImage
    ? file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg"
    : "pdf";
  const path = `${userId}/${chatId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
  });

  if (error) {
    return { path: null, attachment_type: null, error: error.message };
  }

  return {
    path,
    attachment_type: isImage ? "image" : "file",
    error: null,
  };
};
