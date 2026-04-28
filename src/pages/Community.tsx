import { useState } from "react";
import { posts } from "@/data/dummy";
import { PageHeader } from "@/components/PageHeader";
import { Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const Community = () => {
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="animate-fade-in">
      <PageHeader title="Sangha" subtitle="A community of seekers" action={
        <button onClick={() => setComposing(true)} className="h-10 w-10 rounded-full bg-gradient-saffron grid place-items-center shadow-warm">
          <Plus className="h-5 w-5 text-primary-foreground" />
        </button>
      } />

      <div className="px-5 space-y-4">
        {posts.map((p, i) => (
          <article key={p.id} className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <img src={p.avatar} alt={p.author} loading="lazy" className="h-11 w-11 rounded-full object-cover" />
              <div>
                <p className="font-medium">{p.author}</p>
                <p className="text-xs text-muted-foreground">{p.time} ago</p>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed">{p.text}</p>
            <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Heart className="h-4 w-4" /> {p.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <MessageCircle className="h-4 w-4" /> {p.comments}
              </button>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {composing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-warm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl">Share with sangha</h3>
              <button onClick={() => setComposing(false)} className="h-8 w-8 rounded-full bg-secondary grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What is alive in you today?" className="min-h-[140px] bg-background border-border/60 resize-none" />
            <div className="flex items-center justify-between mt-4">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <ImageIcon className="h-4 w-4" /> Add image
              </button>
              <Button onClick={() => { setComposing(false); setText(""); }} className="bg-gradient-saffron text-primary-foreground shadow-warm">Share</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
