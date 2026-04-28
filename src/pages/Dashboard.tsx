import { Link } from "react-router-dom";
import { matches } from "@/data/dummy";
import { Bell, Sparkles, Flame, Calendar } from "lucide-react";
import mandala from "@/assets/mandala-bg.jpg";

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <header className="relative px-5 pt-8 pb-6 overflow-hidden">
        <img src={mandala} alt="" aria-hidden className="absolute -top-32 -right-32 w-[400px] opacity-15 animate-spin-slow pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Namaste 🙏</p>
            <h1 className="font-serif text-4xl mt-2 leading-tight">Good morning,<br/><span className="text-gradient-saffron">Ananya</span></h1>
          </div>
          <button className="h-10 w-10 rounded-full bg-card/80 backdrop-blur grid place-items-center relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      {/* Daily verse */}
      <div className="mx-5 glass-card rounded-2xl p-5 bg-gradient-dusk text-ivory">
        <p className="text-xs uppercase tracking-[0.25em] text-primary-glow mb-2">Verse of the day</p>
        <p className="font-serif italic text-xl leading-snug">"The soul is neither born, and nor does it die."</p>
        <p className="text-xs mt-3 opacity-80">— Bhagavad Gita 2.20</p>
      </div>

      {/* Stats */}
      <section className="px-5 mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: Sparkles, label: "Matches", value: "12", tint: "bg-primary/10 text-primary" },
          { icon: Flame, label: "Streak", value: "47d", tint: "bg-accent/20 text-accent" },
          { icon: Calendar, label: "Events", value: "3", tint: "bg-secondary text-foreground" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className={`h-9 w-9 rounded-xl mx-auto grid place-items-center ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-serif text-2xl mt-2">{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Suggested matches */}
      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl">Suggested for you</h2>
          <Link to="/app/matches" className="text-sm text-primary font-medium">See all →</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto -mx-5 px-5 pb-4 snap-x snap-mandatory scrollbar-none">
          {matches.map((m) => (
            <Link key={m.id} to={`/app/profile/${m.id}`} className="snap-start shrink-0 w-44 group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-card">
                <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-semibold text-primary">
                  {m.compatibility}%
                </span>
                <div className="absolute bottom-0 inset-x-0 p-3 text-ivory">
                  <p className="font-serif text-lg leading-none">{m.name}, {m.age}</p>
                  <p className="text-xs opacity-90 mt-1">{m.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-5 mt-6">
        <h2 className="font-serif text-2xl mb-4">Your sadhana</h2>
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {[
            { label: "Morning meditation", done: true, time: "20 min" },
            { label: "Mantra japa", done: true, time: "108 rounds" },
            { label: "Evening satsang", done: false, time: "7:00 PM" },
          ].map((a) => (
            <div key={a.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${a.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {a.done ? "✓" : "○"}
                </div>
                <div>
                  <p className={`text-sm font-medium ${a.done && "line-through text-muted-foreground"}`}>{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium teaser */}
      <section className="px-5 mt-6">
        <Link to="/app/subscription" className="block glass-card rounded-2xl p-5 bg-gradient-gold relative overflow-hidden">
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.25em] text-clay font-semibold">AatmamIlan Sacred</p>
            <p className="font-serif text-xl mt-1 text-clay">Unlock unlimited matches & retreats</p>
            <p className="text-sm text-clay/80 mt-3">Upgrade →</p>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Dashboard;
