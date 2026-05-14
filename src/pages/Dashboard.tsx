import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Sparkles,
  Flame,
  Calendar,
  Footprints,
  Waves,
  Crown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import mandala from "@/assets/mandala-bg.jpg";
import { useEffect, useMemo, useState } from "react";
import {
  getDiscoverySuggestionsExceptRelations,
  getCurrentUserProfile,
  getDisplayName,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  getProfileCompletionPercent,
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
import { SacredVerificationSeal } from "@/components/sacred/SacredVerificationSeal";
import { supabase } from "@/lib/supabaseClient";
import { dietOptions, gurus, lifestyleOptions, optionLabel, sadhanaFrequencies, spiritualPaths } from "@/lib/onboardingOptions";

type SubscriptionSummary = {
  plan: string | null;
  status: string | null;
  updated_at: string | null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<UserProfileWithCompatibility[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionSummary>({ plan: null, status: null, updated_at: null });

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
        setSubscription({ plan: null, status: null, updated_at: null });
        return;
      }

      const [sent, received, confirmed, unseen, notifRows, subRes] = await Promise.all([
        getSentRequests(myProfile.id),
        getReceivedRequests(myProfile.id),
        getMatches(myProfile.id),
        getUnseenNotificationCount(myProfile.id),
        getNotifications(myProfile.id),
        supabase
          .from("subscriptions")
          .select("plan,status,updated_at")
          .eq("user_id", myProfile.id)
          .order("created_at", { ascending: false })
          .maybeSingle(),
      ]);
      setSentCount(sent.length);
      setReceivedCount(received.count);
      setConfirmedCount(confirmed.length);
      setUnseenCount(unseen);
      setNotifications(notifRows);
      if (subRes.data) {
        setSubscription({
          plan: subRes.data.plan,
          status: subRes.data.status,
          updated_at: subRes.data.updated_at ?? null,
        });
      } else {
        setSubscription({ plan: null, status: null, updated_at: null });
      }
    };

    void load();
  }, []);

  const curatedSouls = useMemo(() => {
    const sorted = [...matches].sort((a, b) => (b.compatibility ?? 0) - (a.compatibility ?? 0));
    return sorted.slice(0, 3).map((m) => ({
      id: m.id,
      compatibility: m.compatibility,
      name: getDisplayName(m),
      age: getProfileAge(m),
      location: getProfileCity(m),
      photo: getProfilePhotoUrl(m),
    }));
  }, [matches]);

  const resonanceLabel = useMemo(() => {
    if (!curatedSouls.length) {
      return "—";
    }
    const top = Math.max(...curatedSouls.map((c) => c.compatibility));
    return `${top}%`;
  }, [curatedSouls]);

  const completionPct = getProfileCompletionPercent(me);
  const myName = me ? getDisplayName(me) : "Seeker";
  const pathLabel = me ? optionLabel(spiritualPaths, me.spiritual_path) : "—";
  const guruLine = useMemo(() => {
    if (!me?.guru) {
      return "Your lineage unfolds here.";
    }
    const entry = gurus.find((g) => g.id === me.guru);
    return entry ? `${entry.name} · ${entry.tradition}` : me.guru;
  }, [me]);

  const identitySummary = useMemo(() => {
    if (!me) {
      return "Your story will appear as your profile deepens.";
    }
    const parts = [
      me.sadhana_frequency ? optionLabel(sadhanaFrequencies, me.sadhana_frequency) : null,
      me.practices?.length ? `${me.practices.length} practices on your path` : null,
    ].filter(Boolean);
    const base = me.bio?.trim() ? me.bio.trim().slice(0, 140) + (me.bio.trim().length > 140 ? "…" : "") : null;
    if (base) {
      return base;
    }
    if (parts.length) {
      return parts.join(" · ");
    }
    return "Continue shaping your profile so kindred souls sense your presence.";
  }, [me]);

  const partnerLines = useMemo(() => {
    if (!me) {
      return { guru: "—", path: "—", age: "—", lifestyle: "—" };
    }
    const guruPref = gurus.find((g) => g.id === me.guru)?.name ?? me.guru ?? "Open to aligned lineages";
    const pathPref = pathLabel !== "—" ? pathLabel : "Paths revealed in profile";
    const agePref =
      me.age != null
        ? `Your season: ${me.age} — widen or narrow in profile when partner age feels clear`
        : "Preferred age range — complete profile when ready";
    const dietLbl = optionLabel(dietOptions, me.diet);
    const lifeLbl = optionLabel(lifestyleOptions, me.lifestyle);
    const lifestyle = [dietLbl !== "—" ? dietLbl : null, lifeLbl !== "—" ? lifeLbl : null].filter(Boolean).join(" · ") || "Lifestyle — refine in profile";
    return { guru: guruPref, path: pathPref, age: agePref, lifestyle };
  }, [me, pathLabel]);

  const membershipCopy = useMemo(() => {
    const paid = (subscription.plan === "premium" || subscription.plan === "moksha") && subscription.status === "active";
    const ending =
      (subscription.plan === "premium" || subscription.plan === "moksha") && subscription.status === "cancelled";
    if (paid) {
      const isMoksha = subscription.plan === "moksha";
      return {
        title: isMoksha ? "Moksha path" : "Deeper path (Sacred)",
        detail: isMoksha
          ? "Guided depth until union feels complete — invitations, resonance, and matchmaker care."
          : "Full invitations, chat, and compatibility depth — your field opens with intention.",
        validity: subscription.updated_at
          ? `Last renewed ${new Date(subscription.updated_at).toLocaleDateString()}`
          : "Active on the path",
        cta: "Manage membership",
      };
    }
    if (ending) {
      return {
        title: "Membership completing",
        detail: "Paid grace still rests with you until this cycle closes. Renew when you feel called.",
        validity: "Honouring what remains",
        cta: "Continue membership",
      };
    }
    return {
      title: "Seeker path",
      detail: "Walk at your rhythm. Upgrading widens the field with intention.",
      validity: "Open access · gentle limits",
      cta: "View offerings",
    };
  }, [subscription]);

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

  const statusCards = [
    {
      icon: Sparkles,
      label: "Sacred connections",
      value: String(confirmedCount),
      to: "/app/matches#sacred-connections",
      hint: "Mutual recognition",
    },
    {
      icon: Calendar,
      label: "Invitations received",
      value: String(receivedCount),
      to: "/app/matches#soul-invitations-received",
      hint: "Knocking gently",
    },
    {
      icon: Flame,
      label: "Awaiting responses",
      value: String(sentCount),
      to: "/app/matches#invitations-sent",
      hint: "Offered in faith",
    },
    {
      icon: Footprints,
      label: "Visitors",
      value: "—",
      to: "/app/profile",
      hint: "Footsteps on your path",
    },
    {
      icon: Waves,
      label: "Compatibility resonance",
      value: resonanceLabel,
      to: "/app/matches#discovery",
      hint: "Highest alignment in field",
    },
  ];

  return (
    <div className="animate-fade-in pb-10">
      <header className="relative px-5 pt-8 pb-6 overflow-hidden">
        <img
          src={mandala}
          alt=""
          aria-hidden
          className="absolute -top-32 -right-32 w-[400px] opacity-12 animate-spin-slow pointer-events-none"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Namaste 🙏</p>
            <h1 className="font-serif text-3xl sm:text-4xl mt-2 leading-tight">
              Peace upon your path,
              <br />
              <span className="text-gradient-saffron">{myName}</span>
            </h1>
          </div>
          <DropdownMenu onOpenChange={handleOpenBell}>
            <DropdownMenuTrigger asChild>
              <button type="button" className="h-10 w-10 rounded-full bg-card/80 backdrop-blur grid place-items-center relative shrink-0 border border-border/50">
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
                <DropdownMenuItem
                  key={n.id}
                  className="cursor-pointer flex flex-col items-start gap-0.5"
                  onClick={() => void handleNotificationNavigate(n)}
                >
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

      <div className="mx-5 glass-card rounded-2xl p-5 bg-gradient-dusk text-ivory shadow-card">
        <p className="text-xs uppercase tracking-[0.25em] text-primary-glow mb-2">Verse of the day</p>
        <p className="font-serif italic text-xl leading-snug">&quot;The soul is neither born, and nor does it die.&quot;</p>
        <p className="text-xs mt-3 opacity-80">— Bhagavad Gita 2.20</p>
      </div>

      <section className="px-5 mt-8 space-y-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Sanctuary</p>
            <h2 className="font-serif text-2xl mt-1">Your journey</h2>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5 shadow-card border border-border/50 space-y-5">
          <div className="flex gap-4">
            <div className="relative shrink-0">
              {me ? (
                <img src={getProfilePhotoUrl(me)} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/15" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-muted animate-pulse ring-2 ring-primary/10" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-serif text-xl leading-tight truncate">{myName}</p>
              <p className="text-sm text-muted-foreground leading-snug">{guruLine}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-primary/90 bg-primary/10 px-2.5 py-1 rounded-full">{pathLabel}</span>
                <span className="text-[11px] text-muted-foreground">Profile {completionPct}%</span>
              </div>
            </div>
          </div>

          <SacredVerificationSeal status={me?.verification_status ?? "unverified"} />

          <p className="text-sm text-foreground/85 leading-relaxed font-serif">{identitySummary}</p>

          <Link
            to="/app/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary border border-primary/25 rounded-full px-4 py-2 hover:bg-primary/5 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit profile
          </Link>
        </div>
      </section>

      <section className="px-5 mt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Sacred glance</p>
        <div className="grid grid-cols-2 gap-3">
          {statusCards.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="glass-card rounded-2xl p-4 border border-border/40 shadow-soft hover:shadow-card transition-shadow min-h-[108px] flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${s.label === "Visitors" ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <span className={`font-serif text-2xl leading-none ${s.label === "Visitors" ? "text-muted-foreground text-lg" : ""}`}>{s.value}</span>
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight mt-2">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{s.hint}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed px-0.5">
          Visitors will gather quietly here when the path opens for profile presence — for now, tend your sanctuary in profile settings.
        </p>
      </section>

      <section className="px-5 mt-8">
        <div className="glass-card rounded-3xl p-5 border border-primary/15 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Membership</p>
              <p className="font-serif text-xl mt-1">{membershipCopy.title}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{membershipCopy.detail}</p>
              <p className="text-xs text-muted-foreground/90 mt-2">{membershipCopy.validity}</p>
            </div>
          </div>
          <Link
            to="/app/subscription"
            className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-background/60 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            {membershipCopy.cta}
            <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
          </Link>
        </div>
      </section>

      <section className="px-5 mt-8 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resonance you invite</p>
            <h2 className="font-serif text-xl mt-1">Partner preferences</h2>
          </div>
          <Link to="/app/profile" className="text-xs text-primary font-medium shrink-0">
            Refine →
          </Link>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border/50 space-y-3 text-sm">
          <div className="flex justify-between gap-3 border-b border-border/40 pb-3">
            <span className="text-muted-foreground shrink-0">Guru / lineage</span>
            <span className="text-right font-medium leading-snug">{partnerLines.guru}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/40 pb-3">
            <span className="text-muted-foreground shrink-0">Spiritual path</span>
            <span className="text-right font-medium leading-snug">{partnerLines.path}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/40 pb-3">
            <span className="text-muted-foreground shrink-0">Age harmony</span>
            <span className="text-right font-medium leading-snug">{partnerLines.age}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Lifestyle</span>
            <span className="text-right font-medium leading-snug">{partnerLines.lifestyle}</span>
          </div>
        </div>
      </section>

      <section className="px-5 mt-8 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Footfalls</p>
          <h2 className="font-serif text-xl mt-1">Souls who visited your path</h2>
          <p className="text-sm text-muted-foreground mt-1">A quiet corner for presence — not noise.</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-dashed border-border/70 text-center text-sm text-muted-foreground leading-relaxed">
          When seekers pause at your profile with reverence, gentle previews will rest here. This blessing is not tracked yet — your invitations and connections
          continue in Connections.
        </div>
      </section>

      <section className="px-5 mt-8 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curated field</p>
            <h2 className="font-serif text-2xl mt-1">Suggested souls</h2>
          </div>
          <Link to="/app/matches#discovery" className="text-sm text-primary font-medium shrink-0">
            Open workspace →
          </Link>
        </div>
        <div className="space-y-3">
          {curatedSouls.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 glass-card rounded-2xl border border-border/50">
              The field is resting. Discovery lives in Connections when you are ready.
            </p>
          )}
          {curatedSouls.map((m) => (
            <Link key={m.id} to={`/app/profile/${m.id}`} className="glass-card rounded-2xl p-4 shadow-soft flex items-center gap-4 border border-border/40">
              <img src={m.photo} alt={m.name} loading="lazy" className="h-14 w-14 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <p className="font-medium truncate">
                  {m.name}, {m.age}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.location}</p>
              </div>
              <span className="text-xs font-semibold text-primary shrink-0 tabular-nums">{m.compatibility}%</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
