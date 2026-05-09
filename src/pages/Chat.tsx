import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Send, Smile, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getChats, type ChatListItem } from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import { getMessages, sendMessage, subscribeToMessages, type DbMessage } from "@/lib/chat";

const sortByCreated = (list: DbMessage[]) =>
  [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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
              {c.unread > 0 && <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">{c.unread}</span>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
  );
};

const ChatRoom = ({ id }: { id: string }) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
          return !(m.sender_id === newMessage.sender_id && m.content === newMessage.content);
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

  const c = useMemo(() => chats.find((x) => x.id === id) || chats[0], [chats, id]);

  const handleSend = async () => {
    if (!myUserId || !text.trim() || isSending) {
      return;
    }

    const trimmed = text.trim();
    const tempId = `optimistic:${crypto.randomUUID()}`;
    const optimistic: DbMessage = {
      id: tempId,
      chat_id: id,
      sender_id: myUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => sortByCreated([...prev, optimistic]));
    setText("");
    setIsSending(true);

    const result = await sendMessage(id, myUserId, trimmed);
    setIsSending(false);

    if (!result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
      return;
    }

    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => m.id !== tempId);
      if (withoutTemp.some((m) => m.id === result.message.id)) {
        return sortByCreated(withoutTemp);
      }
      return sortByCreated([...withoutTemp, result.message]);
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">
        <Link to="/app/chat" className="h-9 w-9 rounded-full bg-secondary grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <img src={c?.avatar} alt={c?.name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="font-medium leading-none">{c?.name ?? "Conversation"}</p>
          <p className="text-[11px] text-primary mt-1">● online</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-3 pb-32">
        <p className="text-center text-xs text-muted-foreground italic">Today</p>
        {loading && <p className="text-center text-sm text-muted-foreground">Loading messages...</p>}
        {!loading && messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === myUserId ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-soft ${
              m.sender_id === myUserId ? "bg-gradient-saffron text-primary-foreground rounded-br-sm" : "bg-card border border-border/60 rounded-bl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 inset-x-0 px-4">
        <div className="max-w-md mx-auto flex items-center gap-2 bg-card border border-border/60 rounded-full p-1.5 shadow-card">
          <button className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><Plus className="h-4 w-4" /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }} placeholder="Type a message…" className="flex-1 bg-transparent outline-none text-sm px-2" />
          <button className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><Smile className="h-4 w-4" /></button>
          <button onClick={() => void handleSend()} disabled={!myUserId || isSending} className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shrink-0 shadow-warm">
            <Send className="h-4 w-4 text-primary-foreground" />
          </button>
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
