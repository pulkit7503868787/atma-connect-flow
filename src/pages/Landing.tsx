import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-spiritual.jpg";
import mandala from "@/assets/mandala-bg.jpg";
import { Heart, Sparkles, Users } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[100svh] flex flex-col">
        <img src={hero} alt="Meditator at sunrise in the Himalayas" className="absolute inset-0 h-full w-full object-cover" width={1536} height={1024} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background" />
        <img src={mandala} alt="" aria-hidden className="absolute -top-20 -right-20 w-[420px] opacity-20 animate-spin-slow pointer-events-none" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪔</span>
            <span className="font-serif text-2xl tracking-tight">AatmamIlan</span>
          </div>
          <Link to="/auth" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">Sign in</Link>
        </nav>

        <div className="relative z-10 mt-auto px-6 pb-16 max-w-md">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 animate-fade-in">Where souls meet</p>
          <h1 className="font-serif text-5xl sm:text-6xl leading-[1.05] text-foreground animate-slide-up">
            Find a partner who walks the <em className="text-gradient-saffron not-italic">same path</em>.
          </h1>
          <p className="mt-5 text-base text-muted-foreground max-w-sm animate-slide-up" style={{ animationDelay: "0.1s" }}>
            A sacred space for spiritually aligned individuals to meet — by guru, practice, and inner growth.
          </p>
          <div className="mt-8 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button asChild size="lg" className="bg-gradient-saffron text-primary-foreground shadow-warm h-14 text-base font-medium hover:opacity-95">
              <Link to="/auth">Begin your journey</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 text-foreground/70 hover:text-foreground hover:bg-secondary/50">
              <Link to="/app">Explore as guest →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 py-20 max-w-md mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-primary text-center mb-3">Sacred · Mindful · Aligned</p>
        <h2 className="font-serif text-4xl text-center mb-12">Beyond profiles. Into presence.</h2>
        <div className="space-y-6">
          {[
            { icon: Sparkles, title: "Guided by Guru", text: "Connect by lineage, tradition, and the teacher whose path you walk." },
            { icon: Heart, title: "Compatibility of Consciousness", text: "Match on practices, values, and inner growth — not just hobbies." },
            { icon: Users, title: "A Living Sangha", text: "Satsangs, retreats, and a community of seekers worldwide." },
          ].map((p, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-11 w-11 rounded-xl bg-gradient-gold grid place-items-center mb-4 shadow-soft">
                <p.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-serif text-2xl mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="font-serif italic text-xl text-muted-foreground">"When two flames meet, they do not extinguish — they illuminate."</p>
          <Button asChild size="lg" className="mt-8 bg-foreground text-background hover:bg-foreground/90 h-14 px-10 rounded-full">
            <Link to="/auth">Start free</Link>
          </Button>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground border-t border-border/50">
        ॐ AatmamIlan · A union of souls
      </footer>
    </div>
  );
};

export default Landing;
