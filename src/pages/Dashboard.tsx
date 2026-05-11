import { Link, useNavigate } from "react-router-dom";
import { Bell, Sparkles, Flame, Calendar } from "lucide-react";
import mandala from "@/assets/mandala-bg.jpg";
import { useEffect, useMemo, useState } from "react";
import {
  getDiscoverySuggestionsExceptRelations,
  getCurrentUserProfile,
  getDisplayName,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  type UserProfile,
  type UserProfileWithCompatibility,
} from "@/lib/db";
import { getMatches, getReceivedRequests, getSentRequests } from "@/lib/likes";
import {
  getNotifications,
  getUnseenNotificationCount,
  markNotificationSeenById,
  markNotificationsSeen,
  type AppNotification,
} from "@/lib/notifications";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<UserProfileWithCompatibility[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const load = async () => {
      const [myProfile, data] = await Promise.all([getCurrentUserProfile(), getDiscoverySuggestionsExceptRelations()]);
      setMe(myProfile);
      setMatches(data);

      if (!myProfile) {
        setSentCount(0);
        setReceivedCount(0);
        setConfirmedCount(0);
        setNotifications([]);
        return;
      }

      const [sent, received, confirmed, unseen, notifRows] = await Promise.all([
        getSentRequests(myProfile.id),
        getReceivedRequests(myProfile.id),
        getMatches(myProfile.id),
        getUnseenNotificationCount(myProfile.id),
        getNotifications(myProfile.id),
      ]);
      setSentCount(sent.length);
      setReceivedCount(received.count);
      setConfirmedCount(confirmed.length);
      setUnseenCount(unseen);
      setNotifications(notifRows);
    };

    void load();
  }, []);

  const suggested = useMemo(
    () =>
      matches.map((m) => ({
        id: m.id,
        compatibility: m.compatibility,
        name: getDisplayName(m),
        age: getProfileAge(m),
        location: getProfileCity(m),
        photo: getProfilePhotoUrl(m),
      })),
    [matches]
  );
  const myName = me ? getDisplayName(me) : "Seeker";

  const handleOpenBell = (open: boolean) => {
    if (open && me?.id) {
      void getNotifications(me.id).then(setNotifications);
    }
  };

  const handleNotificationNavigate = async (n: AppNotification) => {
    if (!me?.id) {
      return;
    }
    await markNotificationSeenById(me.id, n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, seen: true } : x)));
    const unseen = await getUnseenNotificationCount(me.id);
    setUnseenCount(unseen);

    if (n.type === "message" && n.reference_id) {
      navigate(`/app/chat/${n.reference_id}`);
      return;
    }
    if ((n.type === "like" || n.type === "match") && n.reference_id) {
      navigate(`/app/profile/${n.reference_id}`);
      return;
    }
    navigate("/app");
  };

  const handleMarkAllNotificationsSeen = async () => {
    if (!me?.id) {
      return;
    }
    const ok = await markNotificationsSeen(me.id);
    if (ok) {
      setUnseenCount(0);
      setNotifications((prev) => prev.map((x) => ({ ...x, seen: true })));
      toast.success("Notifications marked as seen.");
    } else {
      toast.error("Could not update notifications.");
    }
  };

  const notificationLabel = (n: AppNotification) => {
    if (n.type === "like") {
      return "New connection request";
    }
    if (n.type === "match") {
      return "New match";
    }
    return "New message";
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <header className="relative px-5 pt-8 pb-6 overflow-hidden">
        <img src={mandala} alt="" aria-hidden className="absolute -top-32 -right-32 w-[400px] opacity-15 animate-spin-slow pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Namaste 🙏</p>
            <h1 className="font-serif text-4xl mt-2 leading-tight">Good morning,<br/><span className="text-gradient-saffron">{myName}</span></h1>
          </div>
          <DropdownMenu onOpenChange={handleOpenBell}>
            <DropdownMenuTrigger asChild>
              <button type="button" className="h-10 w-10 rounded-full bg-card/80 backdrop-blur grid place-items-center relative">
                <Bell className="h-5 w-5" />
                {unseenCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
                    {unseenCount > 9 ? "9+" : unseenCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 max-h-64 overflow-y-auto">
              {notifications.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">No notifications yet.</div>}
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="cursor-pointer flex flex-col items-start gap-0.5" onClick={() => void handleNotificationNavigate(n)}>
                  <span className="font-medium">{notificationLabel(n)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </DropdownMenuItem>
              ))}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => void handleMarkAllNotificationsSeen()}>
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          { icon: Sparkles, label: "Matches", value: String(confirmedCount), tint: "bg-primary/10 text-primary", to: "/app/matches" },
          { icon: Flame, label: "Sent", value: String(sentCount), tint: "bg-accent/20 text-accent", to: "/app/matches?view=sent" },
          { icon: Calendar, label: "Received", value: String(receivedCount), tint: "bg-secondary text-foreground", to: "/app/matches?view=received" },
        ].map((s) => (
          <Link to={s.to} key={s.label} className="glass-card rounded-2xl p-4 text-center hover:shadow-warm transition-all">
            <div className={`h-9 w-9 rounded-xl mx-auto grid place-items-center ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-serif text-2xl mt-2">{s.value}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </Link>
        ))}
      </section>

      {/* Suggested matches */}
      <section className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl">Suggested for you</h2>
          <Link to="/app/matches?view=suggestions" className="text-sm text-primary font-medium">
            See all →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto -mx-5 px-5 pb-4 snap-x snap-mandatory scrollbar-none">
          {suggested.map((m) => (
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
