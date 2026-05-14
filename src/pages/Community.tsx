import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  X,
  Image as ImageIcon,
  Send,
  Calendar,
  MapPin,
  Link2,
  Mic,
  Video,
  LayoutGrid,
  UserRound,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getPosts,
  createPost,
  toggleLikePost,
  getPostComments,
  addComment,
  getPostLikeSnapshot,
  POST_CATEGORY_LABELS,
  hidePostsFromAuthor,
  type Post,
  type PostComment,
  type PostCategory,
} from "@/lib/posts";
import { uploadCommunityMedia } from "@/lib/postStorage";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

const CATEGORIES: PostCategory[] = ["reflection", "satsang_experience", "meditation_audio", "teaching"];

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<PostCategory>("reflection");
  const [sharing, setSharing] = useState(false);
  const [composeImages, setComposeImages] = useState<File[]>([]);
  const [composeImagePreviews, setComposeImagePreviews] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const composeImageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);
    const data = await getPosts(user?.id);
    setPosts(data);
    setLoading(false);
  };

  const revokePreviews = (urls: string[]) => {
    urls.forEach((u) => URL.revokeObjectURL(u));
  };

  const clearComposeMedia = () => {
    revokePreviews(composeImagePreviews);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setComposeImages([]);
    setComposeImagePreviews([]);
    setAudioFile(null);
    setVideoFile(null);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleComposeImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) {
      return;
    }
    revokePreviews(composeImagePreviews);
    setComposeImages(files);
    setComposeImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleShare = async () => {
    const needsEventMeta = category === "satsang_experience";
    if (needsEventMeta && (!eventTitle.trim() || !eventStartsAt)) {
      toast.error("Please add a title and date for this gathering.");
      return;
    }
    if (
      !needsEventMeta &&
      !text.trim() &&
      composeImages.length === 0 &&
      !audioFile &&
      !videoFile
    ) {
      toast.error("Share a reflection or attach gentle media.");
      return;
    }

    setSharing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSharing(false);
      toast.error("Please sign in.");
      return;
    }

    const imagePaths: string[] = [];
    for (const img of composeImages) {
      const up = await uploadCommunityMedia(user.id, img, "image");
      if (up.error || !up.path) {
        setSharing(false);
        toast.error(up.error ?? "Could not upload an image.");
        return;
      }
      imagePaths.push(up.path);
    }

    let audioPath: string | null = null;
    if (audioFile) {
      const up = await uploadCommunityMedia(user.id, audioFile, "audio");
      if (up.error || !up.path) {
        setSharing(false);
        toast.error(up.error ?? "Could not upload audio.");
        return;
      }
      audioPath = up.path;
    }

    let videoPath: string | null = null;
    if (videoFile) {
      const up = await uploadCommunityMedia(user.id, videoFile, "video");
      if (up.error || !up.path) {
        setSharing(false);
        toast.error(up.error ?? "Could not upload video.");
        return;
      }
      videoPath = up.path;
    }

    let coverPath: string | null = null;
    if (coverFile) {
      const up = await uploadCommunityMedia(user.id, coverFile, "image");
      if (up.error || !up.path) {
        setSharing(false);
        toast.error(up.error ?? "Could not upload cover image.");
        return;
      }
      coverPath = up.path;
    }

    const result = await createPost({
      content: text.trim(),
      category,
      imagePaths,
      audioPath,
      videoPath,
      eventTitle: needsEventMeta ? eventTitle.trim() : null,
      eventStartsAt: needsEventMeta ? new Date(eventStartsAt).toISOString() : null,
      eventLocation: eventLocation.trim() || null,
      eventLink: eventLink.trim() || null,
      coverImagePath: coverPath,
    });

    setSharing(false);
    if (!result.ok || !result.post) {
      toast.error(result.error ?? "Could not share post.");
      return;
    }
    setPosts((prev) => [result.post!, ...prev]);
    setText("");
    setCategory("reflection");
    setEventTitle("");
    setEventStartsAt("");
    setEventLocation("");
    setEventLink("");
    clearComposeMedia();
    setComposing(false);
    toast.success("Shared with sangha.");
  };

  const handleLike = async (postId: string) => {
    const result = await toggleLikePost(postId);
    if (!result.ok) {
      if (result.error) {
        toast.error(result.error);
      }
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const snap = await getPostLikeSnapshot(postId, user?.id);
    if (!snap) {
      return;
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, liked_by_me: snap.liked_by_me, likes_count: snap.likes_count } : p))
    );
  };

  const openComments = async (postId: string) => {
    setCommentPostId(postId);
    setLoadingComments(true);
    const data = await getPostComments(postId);
    setComments(data);
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !commentPostId) {
      return;
    }
    const result = await addComment(commentPostId, commentText.trim());
    if (!result.ok || !result.comment) {
      toast.error(result.error ?? "Could not add comment.");
      return;
    }
    setComments((prev) => [...prev, result.comment!]);
    setCommentText("");
    if (result.comments_count != null) {
      setPosts((prev) =>
        prev.map((p) => (p.id === commentPostId ? { ...p, comments_count: result.comments_count! } : p))
      );
    }
  };

  const handleShareExternal = async (post: Post) => {
    const shareData = {
      title: "AatmamIlan Sangha",
      text: `${post.author_name}: ${post.content}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast.success("Copied to clipboard.");
    }
  };

  const handleHideAuthor = async (authorId: string) => {
    const res = await hidePostsFromAuthor(authorId);
    if (!res.ok) {
      toast.error(res.error ?? "Could not update feed.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.user_id !== authorId));
    toast.success("Their posts will no longer appear in your feed.");
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) {
      return "just now";
    }
    const mins = Math.floor(seconds / 60);
    if (mins < 60) {
      return `${mins}m ago`;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return `${hrs}h ago`;
    }
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const formatEventWhen = (iso: string | null) => {
    if (!iso) {
      return "";
    }
    try {
      return new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const showEventFields = category === "satsang_experience";

  const canSubmitShare =
    showEventFields
      ? Boolean(eventTitle.trim() && eventStartsAt)
      : Boolean(text.trim() || composeImages.length || audioFile || videoFile);

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader
        title="Sangha"
        subtitle="A quiet circle of seekers — share with intention, not noise"
        action={
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shadow-warm"
            aria-label="Compose"
          >
            <Plus className="h-5 w-5 text-primary-foreground" />
          </button>
        }
      />

      <div className="px-5 space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Gathering reflections…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12 leading-relaxed">
            The sangha is listening. When you are ready, share a reflection or a gathering.
          </p>
        )}
        {posts.map((p, i) => (
          <article
            key={p.id}
            className="glass-card rounded-2xl p-5 border border-border/40 shadow-soft"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={p.author_avatar} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.author_name}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 px-2.5 py-1 rounded-full bg-primary/8 border border-primary/10">
                  {POST_CATEGORY_LABELS[p.category]}
                </span>
                {currentUserId && p.user_id !== currentUserId ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      to={`/app/profile/${p.user_id}`}
                      className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <UserRound className="h-3 w-3" />
                      Profile & connect
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleHideAuthor(p.user_id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <EyeOff className="h-3 w-3" />
                      Hide from feed
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {(p.category === "satsang_experience") && (p.event_title || p.event_starts_at) && (
              <div className="mt-4 rounded-2xl border border-primary/12 bg-secondary/30 px-4 py-3 space-y-2 text-sm">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="w-full max-h-40 rounded-xl object-cover mb-2" loading="lazy" />
                ) : null}
                {p.event_title ? <p className="font-serif text-lg leading-snug">{p.event_title}</p> : null}
                {p.event_starts_at ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {formatEventWhen(p.event_starts_at)}
                  </p>
                ) : null}
                {p.event_location ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {p.event_location}
                  </p>
                ) : null}
                {p.event_link ? (
                  <a
                    href={p.event_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary text-xs font-medium hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Join link
                  </a>
                ) : null}
              </div>
            )}

            {p.cover_image_url && p.category !== "satsang_experience" ? (
              <img src={p.cover_image_url} alt="" loading="lazy" className="mt-4 w-full max-h-48 rounded-xl object-cover" />
            ) : null}

            {p.image_urls.length > 1 ? (
              <div className={cn("mt-4 grid gap-2", p.image_urls.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
                {p.image_urls.map((url) => (
                  <img key={url} src={url} alt="" loading="lazy" className="w-full h-36 sm:h-40 rounded-xl object-cover" />
                ))}
              </div>
            ) : p.image_urls.length === 1 ? (
              <img src={p.image_urls[0]} alt="" loading="lazy" className="mt-4 w-full max-h-72 rounded-xl object-cover" />
            ) : null}

            {p.content ? <p className="mt-4 text-[15px] leading-relaxed text-foreground/95 whitespace-pre-wrap">{p.content}</p> : null}

            {p.audio_url ? (
              <div className="mt-4 rounded-2xl border border-border/50 bg-background/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Mic className="h-3 w-3" /> Audio
                </p>
                <audio controls preload="none" className="w-full h-9">
                  <source src={p.audio_url} />
                </audio>
              </div>
            ) : null}

            {p.video_url ? (
              <div className="mt-4 rounded-2xl border border-border/50 overflow-hidden bg-black/5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1 flex items-center gap-1.5">
                  <Video className="h-3 w-3" /> Video
                </p>
                <video controls preload="none" playsInline className="w-full max-h-64 object-contain">
                  <source src={p.video_url} />
                </video>
              </div>
            ) : null}

            <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => void handleLike(p.id)}
                className={`flex items-center gap-1.5 transition-colors ${p.liked_by_me ? "text-primary" : "hover:text-primary"}`}
              >
                <Heart className="h-4 w-4" fill={p.liked_by_me ? "currentColor" : "none"} /> {p.likes_count}
              </button>
              <button
                type="button"
                onClick={() => void openComments(p.id)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> {p.comments_count}
              </button>
              <button
                type="button"
                onClick={() => void handleShareExternal(p)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {composing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-warm animate-slide-up max-h-[92vh] overflow-y-auto">
            <input
              ref={composeImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => void handleComposeImagesChange(e)}
            />
            <input ref={audioInputRef} type="file" accept="audio/*" className="sr-only" tabIndex={-1} onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" tabIndex={-1} onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => void handleCoverChange(e)} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Offer to sangha</h3>
              <button
                type="button"
                onClick={() => {
                  setComposing(false);
                  setText("");
                  setCategory("reflection");
                  setEventTitle("");
                  setEventStartsAt("");
                  setEventLocation("");
                  setEventLink("");
                  clearComposeMedia();
                }}
                className="h-8 w-8 rounded-full bg-secondary grid place-items-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Kind of sharing</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="w-full h-11 rounded-xl border border-border/60 bg-background px-3 text-sm mb-4"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {POST_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is alive in your practice today?"
              className="min-h-[120px] bg-background border-border/60 resize-none"
            />

            {showEventFields ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-primary/15 bg-secondary/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">Gathering details</p>
                <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Title" className="bg-background border-border/60" />
                <Input
                  type="datetime-local"
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                  className="bg-background border-border/60"
                />
                <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Place or &quot;Online&quot;" className="bg-background border-border/60" />
                <Input value={eventLink} onChange={(e) => setEventLink(e.target.value)} placeholder="Optional link (Zoom, meet…)" className="bg-background border-border/60" />
                {coverPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/60">
                    <img src={coverPreview} alt="" className="w-full max-h-36 object-cover" />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2"
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Optional cover image
                </button>
              </div>
            ) : null}

            {composeImagePreviews.length > 0 ? (
              <div className={cn("mt-3 grid gap-2", composeImagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                {composeImagePreviews.map((src) => (
                  <img key={src} src={src} alt="" className="w-full h-28 object-cover rounded-xl border border-border/60" />
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
              <button type="button" onClick={() => composeImageInputRef.current?.click()} className="flex items-center gap-2 hover:text-primary">
                <ImageIcon className="h-4 w-4" /> Images
              </button>
              <button type="button" onClick={() => audioInputRef.current?.click()} className="flex items-center gap-2 hover:text-primary">
                <Mic className="h-4 w-4" /> Audio
              </button>
              <button type="button" onClick={() => videoInputRef.current?.click()} className="flex items-center gap-2 hover:text-primary">
                <Video className="h-4 w-4" /> Video
              </button>
            </div>
            {(audioFile || videoFile) && (
              <p className="text-xs text-muted-foreground mt-2">
                {audioFile ? `Audio: ${audioFile.name}` : null}
                {audioFile && videoFile ? " · " : null}
                {videoFile ? `Video: ${videoFile.name}` : null}
              </p>
            )}

            <div className="flex items-center justify-end mt-6">
              <Button
                type="button"
                onClick={() => void handleShare()}
                disabled={sharing || !canSubmitShare}
                className="bg-gradient-saffron text-primary-foreground shadow-warm"
              >
                {sharing ? "Sharing…" : "Share gently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {commentPostId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-warm animate-slide-up flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Responses</h3>
              <button
                type="button"
                onClick={() => {
                  setCommentPostId(null);
                  setComments([]);
                }}
                className="h-8 w-8 rounded-full bg-secondary grid place-items-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {loadingComments && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!loadingComments && comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No responses yet. Offer a kind word.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                  <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-2 flex-1">
                    <p className="text-xs font-medium">{c.author_name}</p>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleAddComment();
                  }
                }}
                placeholder="A thoughtful response…"
                className="h-11 bg-background border-border/60"
              />
              <button
                type="button"
                onClick={() => void handleAddComment()}
                disabled={!commentText.trim()}
                className="h-11 w-11 rounded-full bg-gradient-saffron grid place-items-center shrink-0 shadow-warm disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
