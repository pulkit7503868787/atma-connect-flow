import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Send, Smile, Plus, FileText } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getChats, type ChatListItem } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import { getMessages, sendMessage, subscribeToMessages, type DbMessage } from "@/lib/chat";
import { getChatAttachmentPublicUrl, uploadChatAttachment, type ChatAttachmentKind } from "@/lib/chatAttachmentStorage";
import { toast } from "sonner";

const sortByCreated = (list: DbMessage[]) =>
  [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

/** Short palette — calm symbols, not a full emoji keyboard */
const CHAT_EMOJIS = ["🙏", "✨", "🕉️", "❤️", "☀️", "🌿", "🌸", "📿", "🪷", "🙌", "💫", "🌙", "🍃", "🙇", "🤍", "🌊"];

const ChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      const data = await getChats();
      setChats(data);
      setLoading(false);
    };

    void loadChats();
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Conversations" subtitle="Sacred dialogues" />
      <div className="px-2">
        {loading && <p className="px-3 py-4 text-sm text-muted-foreground">Loading conversations...</p>}
        {!loading && chats.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">No conversations yet.</p>}
        {chats.map((c) => (
          <Link key={c.id} to={`/app/chat/${c.id}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-colors">
            <img src={c.avatar} alt={c.name} loading="lazy" className="h-14 w-14 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="font-medium">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.time}</p>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <p className="text-sm text-muted-foreground truncate">{c.last}</p>
                {c.unread > 0 && (
                  <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

type PendingAttachment = { file: File; previewUrl?: string };

const ChatRoom = ({ id }: { id: string }) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChatRoom = async () => {
      setLoading(true);
      const [
        {
          data: { user },
        },
        chatItems,
        chatMessages,
      ] = await Promise.all([supabase.auth.getUser(), getChats(), getMessages(id)]);

      if (!isMounted) {
        return;
      }

      setMyUserId(user?.id ?? null);
      setChats(chatItems);
      setMessages(sortByCreated(chatMessages));
      setLoading(false);
    };

    void loadChatRoom();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const channel = subscribeToMessages(id, (newMessage) => {
      setMessages((prev) => {
        const withoutMatchingOptimistic = prev.filter((m) => {
          if (!m.id.startsWith("optimistic:")) {
            return true;
          }
          if (m.sender_id !== newMessage.sender_id) {
            return true;
          }
          const sameContent = m.content === newMessage.content;
          const sameAtt = (m.attachment_url || "") === (newMessage.attachment_url || "");
          return !(sameContent && sameAtt);
        });
        if (withoutMatchingOptimistic.some((m) => m.id === newMessage.id)) {
          return sortByCreated(withoutMatchingOptimistic);
        }
        return sortByCreated([...withoutMatchingOptimistic, newMessage]);
      });
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (pending?.previewUrl) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, [pending]);

  useEffect(() => {
    if (!emojiOpen) {
      return;
    }
    const close = (e: MouseEvent) => {
      if (composerBarRef.current?.contains(e.target as Node)) {
        return;
      }
      setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [emojiOpen]);

  const c = useMemo(() => chats.find((x) => x.id === id), [chats, id]);

  const clearPending = () => {
    setPending((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + emoji + el.value.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }
    setPending((prev) => {
      if (prev?.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      return { file, previewUrl };
    });
    setEmojiOpen(false);
  };

  const handleSend = async () => {
    if (!myUserId || isSending) {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && !pending) {
      return;
    }

    const snapshotPending = pending;
    let attachment_url: string | null = null;
    let attachment_type: ChatAttachmentKind | null = null;

    setIsSending(true);
    try {
      if (snapshotPending) {
        const up = await uploadChatAttachment(myUserId, id, snapshotPending.file);
        if (up.error || !up.path || !up.attachment_type) {
          toast.error(up.error ?? "Could not upload attachment.");
          return;
        }
        attachment_url = up.path;
        attachment_type = up.attachment_type;
        if (snapshotPending.previewUrl) {
          URL.revokeObjectURL(snapshotPending.previewUrl);
        }
        setPending(null);
      }

      const tempId = `optimistic:${crypto.randomUUID()}`;
      const optimistic: DbMessage = {
        id: tempId,
        chat_id: id,
        sender_id: myUserId,
        content: trimmed,
        created_at: new Date().toISOString(),
        attachment_url,
        attachment_type,
      };

      setMessages((prev) => sortByCreated([...prev, optimistic]));
      setText("");
      setEmojiOpen(false);

      const result = await sendMessage(id, myUserId, {
        content: trimmed,
        attachment_url,
        attachment_type,
      });

      if (!result.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(trimmed);
        toast.error("Message could not be sent.");
        return;
      }

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === result.message.id)) {
          return sortByCreated(withoutTemp);
        }
        return sortByCreated([...withoutTemp, result.message]);
      });
    } finally {
      setIsSending(false);
    }
  };

  const attachmentPublic = (url: string | null | undefined) => getChatAttachmentPublicUrl(url ?? "");

  return (
    <div className="flex flex-col min-h-screen pb-28">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">
        <Link to="/app/chat" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {c?.otherUserId ? (
          <Link
            to={`/app/profile/${c.otherUserId}`}
            className="flex items-center gap-3 min-w-0 flex-1 rounded-xl py-0.5 pr-2 -my-0.5 hover:bg-secondary/50 transition-colors"
          >
            <img src={c.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 text-left">
              <p className="font-medium leading-none truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Tap to view profile</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
            <div>
              <p className="font-medium leading-none">{loading ? "…" : "Conversation"}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{loading ? "Loading…" : "Sacred dialogue"}</p>
            </div>
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        <p className="text-center text-xs text-muted-foreground italic">Today</p>
        {loading && <p className="text-center text-sm text-muted-foreground">Loading messages...</p>}
        {!loading && messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === myUserId ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-soft ${
                m.sender_id === myUserId
                  ? "bg-gradient-saffron text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border/60 rounded-bl-sm"
              }`}
            >
              {m.attachment_url && m.attachment_type === "image" ? (
                <img
                  src={attachmentPublic(m.attachment_url)}
                  alt=""
                  loading="lazy"
                  className="rounded-lg max-h-52 w-full object-cover mb-1.5"
                />
              ) : null}
              {m.attachment_url && m.attachment_type === "file" ? (
                <a
                  href={attachmentPublic(m.attachment_url)}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-xs underline underline-offset-2 mb-1.5 inline-flex items-center gap-1 ${
                    m.sender_id === myUserId ? "text-primary-foreground/95" : "text-primary"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  PDF document
                </a>
              ) : null}
              {m.content?.trim() ? <p className="whitespace-pre-wrap">{m.content}</p> : null}
            </div>
          </div>
        ))}
      </div>

      <div ref={composerBarRef} className="fixed bottom-20 inset-x-0 px-4 z-20">
        <div className="max-w-md mx-auto relative">
          {emojiOpen ? (
            <div
              className="absolute bottom-full mb-2 left-0 right-0 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-2 shadow-card"
              role="dialog"
              aria-label="Symbols"
            >
              <div className="grid grid-cols-8 gap-0.5">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-[1.15rem] leading-none p-1.5 rounded-lg hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      insertEmoji(emoji);
                      setEmojiOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {pending ? (
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-border/50 bg-secondary/35 px-3 py-2 text-xs">
              {pending.previewUrl ? (
                <img src={pending.previewUrl} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0 border border-border/40" />
              ) : (
                <span className="h-11 w-11 rounded-lg bg-muted grid place-items-center shrink-0 border border-border/40">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </span>
              )}
              <span className="truncate flex-1 text-muted-foreground">{pending.file.name}</span>
              <button type="button" onClick={() => clearPending()} className="h-8 w-8 rounded-full bg-secondary grid place-items-center shrink-0 text-muted-foreground hover:text-foreground">
                ×
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 bg-card border border-border/60 rounded-full p-1.5 shadow-card">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => void handleFilePick(e)}
            />
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setEmojiOpen(false);
              }}
              className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"
              aria-label="Attach image or PDF"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Type a message…"
              className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
            />
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${emojiOpen ? "bg-secondary text-primary" : "bg-secondary"}`}
              aria-label="Symbols"
              aria-expanded={emojiOpen}
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!myUserId || isSending || (!text.trim() && !pending)}
              className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shrink-0 shadow-warm disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const { id } = useParams();
  return id ? <ChatRoom id={id} /> : <ChatList />;
};

export default Chat;
