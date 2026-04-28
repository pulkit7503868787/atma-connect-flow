import { Link, useParams } from "react-router-dom";
import { chats, matches } from "@/data/dummy";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft, Send, Smile, Plus } from "lucide-react";
import { useState } from "react";

const ChatList = () => (
  <div className="animate-fade-in">
    <PageHeader title="Conversations" subtitle="Sacred dialogues" />
    <div className="px-2">
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

const messages = [
  { id: 1, from: "them", text: "Namaste 🙏 I read your bio — Rishikesh holds a special place in my heart too." },
  { id: 2, from: "me", text: "Namaste! Yes, the Ganges has a way of pulling you back. When were you last there?" },
  { id: 3, from: "them", text: "Last Shivaratri. Spent three days in silence at Parmarth Niketan." },
  { id: 4, from: "me", text: "That sounds beautiful 🙏" },
];

const ChatRoom = ({ id }: { id: string }) => {
  const c = chats.find((x) => x.id === id) || chats[0];
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur sticky top-0 z-10">
        <Link to="/app/chat" className="h-9 w-9 rounded-full bg-secondary grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="font-medium leading-none">{c.name}</p>
          <p className="text-[11px] text-primary mt-1">● online</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 pb-32">
        <p className="text-center text-xs text-muted-foreground italic">Today</p>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-soft ${
              m.from === "me" ? "bg-gradient-saffron text-primary-foreground rounded-br-sm" : "bg-card border border-border/60 rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-20 inset-x-0 px-4">
        <div className="max-w-md mx-auto flex items-center gap-2 bg-card border border-border/60 rounded-full p-1.5 shadow-card">
          <button className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><Plus className="h-4 w-4" /></button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="flex-1 bg-transparent outline-none text-sm px-2" />
          <button className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0"><Smile className="h-4 w-4" /></button>
          <button className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shrink-0 shadow-warm">
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
