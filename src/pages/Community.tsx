import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getPosts, createPost, toggleLikePost, getPostComments, addComment, type Post, type PostComment } from "@/lib/posts";
import { uploadCommunityPostImage } from "@/lib/postStorage";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [composeImage, setComposeImage] = useState<File | null>(null);
  const [composeImagePreview, setComposeImagePreview] = useState<string | null>(null);
  const composeImageInputRef = useRef<HTMLInputElement>(null);

  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    void loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const data = await getPosts(user?.id);
    setPosts(data);
    setLoading(false);
  };

  const clearComposeImage = () => {
    if (composeImagePreview) {
      URL.revokeObjectURL(composeImagePreview);
    }
    setComposeImage(null);
    setComposeImagePreview(null);
  };

  const handleComposeImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    clearComposeImage();
    setComposeImage(file);
    setComposeImagePreview(URL.createObjectURL(file));
  };

  const handleShare = async () => {
    if (!text.trim() && !composeImage) {
      toast.error("Write something or add an image before sharing.");
      return;
    }
    setSharing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let imageUrl: string | null = null;
    if (composeImage) {
      if (!user) {
        setSharing(false);
        toast.error("Please sign in to share images.");
        return;
      }
      const uploaded = await uploadCommunityPostImage(user.id, composeImage);
      if (uploaded.error || !uploaded.publicUrl) {
        setSharing(false);
        toast.error(uploaded.error ?? "Could not upload image.");
        return;
      }
      imageUrl = uploaded.publicUrl;
    }
    const result = await createPost(text.trim(), imageUrl);
    setSharing(false);
    if (!result.ok || !result.post) {
      toast.error(result.error ?? "Could not share post.");
      return;
    }
    setPosts((prev) => [result.post!, ...prev]);
    setText("");
    clearComposeImage();
    setComposing(false);
    toast.success("Shared with sangha!");
  };

  const handleLike = async (postId: string) => {
    const result = await toggleLikePost(postId);
    if (!result.ok) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked_by_me: result.liked, likes_count: result.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
          : p
      )
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
    if (!commentText.trim() || !commentPostId) return;
    const result = await addComment(commentPostId, commentText.trim());
    if (!result.ok || !result.comment) {
      toast.error(result.error ?? "Could not add comment.");
      return;
    }
    setComments((prev) => [...prev, result.comment!]);
    setCommentText("");
    setPosts((prev) =>
      prev.map((p) => (p.id === commentPostId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );
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

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Sangha" subtitle="A community of seekers" action={
        <button onClick={() => setComposing(true)} className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shadow-warm">
          <Plus className="h-5 w-5 text-primary-foreground" />
        </button>
      } />

      <div className="px-5 space-y-4">
        {loading && <p className="text-sm text-muted-foreground">Loading posts...</p>}
        {!loading && posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No posts yet. Be the first to share!</p>}
        {posts.map((p, i) => (
          <article key={p.id} className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <img src={p.author_avatar} alt={p.author_name} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
              <div>
                <p className="font-medium">{p.author_name}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</p>
              </div>
            </div>
            {p.image_url && (
              <img src={p.image_url} alt="" loading="lazy" className="mt-4 w-full max-h-72 rounded-xl object-cover" />
            )}
            <p className="mt-4 text-[15px] leading-relaxed">{p.content}</p>
            <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
              <button
                onClick={() => void handleLike(p.id)}
                className={`flex items-center gap-1.5 transition-colors ${p.liked_by_me ? "text-primary" : "hover:text-primary"}`}
              >
                <Heart className="h-4 w-4" fill={p.liked_by_me ? "currentColor" : "none"} /> {p.likes_count}
              </button>
              <button
                onClick={() => void openComments(p.id)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> {p.comments_count}
              </button>
              <button
                onClick={() => void handleShareExternal(p)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Compose Post Modal */}
      {composing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-warm animate-slide-up">
            <input
              ref={composeImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => void handleComposeImageChange(e)}
            />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Share with sangha</h3>
              <button
                type="button"
                onClick={() => {
                  setComposing(false);
                  setText("");
                  clearComposeImage();
                }}
                className="h-8 w-8 rounded-full bg-secondary grid place-items-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is alive in you today?"
              className="min-h-[140px] bg-background border-border/60 resize-none"
            />
            {composeImagePreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-border/60">
                <img src={composeImagePreview} alt="" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => composeImageInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ImageIcon className="h-4 w-4" /> Add image
              </button>
              <Button
                onClick={() => void handleShare()}
                disabled={sharing || (!text.trim() && !composeImage)}
                className="bg-gradient-saffron text-primary-foreground shadow-warm"
              >
                {sharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentPostId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-warm animate-slide-up flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Comments</h3>
              <button onClick={() => { setCommentPostId(null); setComments([]); }} className="h-8 w-8 rounded-full bg-secondary grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {loadingComments && <p className="text-sm text-muted-foreground">Loading comments...</p>}
              {!loadingComments && comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                  <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-2 flex-1">
                    <p className="text-xs font-medium">{c.author_name}</p>
                    <p className="text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleAddComment(); }}
                placeholder="Write a comment..."
                className="h-11 bg-background border-border/60"
              />
              <button
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
