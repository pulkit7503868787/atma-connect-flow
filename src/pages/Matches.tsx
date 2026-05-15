import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Heart, X, Star, MapPin, Sparkles, MessageCircle, Check, Bookmark, Phone } from "lucide-react";
import {
  getDisplayName,
  getCurrentUserProfile,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  getDiscoverySuggestionsExceptRelations,
  getNewcomerProfilesForViewer,
  fetchMatchedContactFields,
  mapSupabaseUserRow,
  USERS_PROFILE_SELECT_PUBLIC,
  type UserProfile,
} from "@/lib/db";
import { type RankedMatch, type MatchingUser } from "@/lib/matching";
import {
  acceptIncomingRequest,
  getMatches,
  getPassedProfilesForUser,
  getReceivedRequests,
  getSentRequests,
  likeUser,
  passUser,
  rejectIncomingRequest,
  superLikeUser,
} from "@/lib/likes";
import { addToShortlist, getShortlistedUserIds, removeFromShortlist, getShortlistedProfiles } from "@/lib/shortlist";
import { createOrGetChat } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DiscoverySwipeSurface } from "@/components/connections/DiscoverySwipeSurface";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────────────────────────
   Types
   ─────────────────────────────────────────────── */

type TabKey = "discovery" | "invitations" | "shortlist" | "released" | "blocked";

interface SoulTab {
  key: TabKey;
  label: string;
  icon: string;
}

/* ───────────────────────────────────────────────
   Constants
   ─────────────────────────────────────────────── */

const TABS: SoulTab[] = [
  { key: "discovery", label: "Discovery", icon: "🌼" },
  { key: "invitations", label: "Invitations", icon: "🤍" },
  { key: "shortlist", label: "Shortlisted", icon: "🪔" },
  { key: "released", label: "Released", icon: "🌙" },
  { key: "blocked", label: "Dusht Aatmaye", icon: "🔥" },
];

/* ───────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────── */

const soulRow = (u: MatchingUser) => (
  <Link key={u.id} to={`/app/profile/${u.id}`} className="flex items-center gap-3 min-w-0">
    <img src={getProfilePhotoUrl(u)} alt={getDisplayName(u)} className="h-14 w-14 rounded-full object-cover shrink-0" />
    <div className="min-w-0 text-left">
      <p className="font-medium truncate">{getDisplayName(u)}</p>
      <p className="text-xs text-muted-foreground">
        {getProfileAge(u)}, {getProfileCity(u)}
      </p>
    </div>
  </Link>
);

/* ───────────────────────────────────────────────
   SoulTabs — wrapped spiritual pills, no horizontal scroll
   ─────────────────────────────────────────────── */

function SoulTabs({
  active,
  onChange,
  counts,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
  counts: Record<TabKey, number>;
}) {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30 -mx-5 px-5 py-3">
      <div className="flex flex-wrap gap-2 justify-center">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`
                relative flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium
                transition-all duration-300 ease-out
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-warm scale-[1.02]"
                    : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/40"
                }
              `}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`
                    ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   FlowSection — preserved with refined spacing
   ─────────────────────────────────────────────── */

function FlowSection({
  sectionId,
  variant,
  eyebrow,
  title,
  description,
  emptyText,
  isEmpty,
  loading,
  children,
}: {
  sectionId: string;
  variant: "field" | "threshold" | "bond" | "keep" | "release";
  eyebrow: string;
  title: string;
  description?: string;
  emptyText: string;
  isEmpty: boolean;
  loading: boolean;
  children: ReactNode;
}) {
  const shell = {
    field: "border-primary/12 bg-card/35 shadow-soft",
    threshold: "border-amber-900/12 bg-gradient-to-b from-card via-card to-secondary/25 shadow-soft",
    bond: "border-primary/20 bg-card/45 shadow-card",
    keep: "border-accent/18 bg-card/30 shadow-soft",
    release: "border-border/55 bg-muted/10 shadow-soft",
  }[variant];

  return (
    <section id={sectionId} className="scroll-mt-28">
      <div className={`rounded-[1.75rem] border p-4 sm:p-5 space-y-4 ${shell}`}>
        <div className="px-0.5 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground leading-relaxed pt-1">{description}</p> : null}
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground px-0.5">Loading…</p>
        ) : isEmpty ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-7 text-center text-sm text-muted-foreground leading-relaxed">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-4">{children}</div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────
   Matches — main component
   ─────────────────────────────────────────────── */

const Matches = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── state (all preserved) ── */
  const [profiles, setProfiles] = useState<RankedMatch[]>([]);
  const [incoming, setIncoming] = useState<MatchingUser[]>([]);
  const [outgoing, setOutgoing] = useState<MatchingUser[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<MatchingUser[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<MatchingUser[]>([]);
  const [shortlistedProfiles, setShortlistedProfiles] = useState<MatchingUser[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [blockedProfiles, setBlockedProfiles] = useState<MatchingUser[]>([]);
  const [newcomerProfiles, setNewcomerProfiles] = useState<MatchingUser[]>([]);
  const [matchContacts, setMatchContacts] = useState<
    Map<string, Awaited<ReturnType<typeof fetchMatchedContactFields>>>
  >(new Map());
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  /* ── tab state ── */
  const [activeTab, setActiveTab] = useState<TabKey>("discovery");

  /* ── reloadHub (preserved exactly) ── */
  const reloadHub = useCallback(async () => {
    const currentUser = await getCurrentUserProfile();
    setMe(currentUser);
    if (!currentUser) {
      setIncoming([]);
      setOutgoing([]);
      setConfirmedMatches([]);
      setPassedProfiles([]);
      setShortlistedProfiles([]);
      setShortlistedIds(new Set());
      setBlockedProfiles([]);
      setNewcomerProfiles([]);
      setMatchContacts(new Map());
      setProfiles([]);
      return;
    }
    const [received, sent, discoveryRows, confirmed, passed, shortlist, slIds, newcomers] = await Promise.all([
      getReceivedRequests(currentUser.id),
      getSentRequests(currentUser.id),
      getDiscoverySuggestionsExceptRelations(),
      getMatches(currentUser.id),
      getPassedProfilesForUser(currentUser.id),
      getShortlistedProfiles(currentUser.id),
      getShortlistedUserIds(currentUser.id),
      getNewcomerProfilesForViewer(),
    ]);
    setIncoming(received.users);
    setOutgoing(sent);
    setConfirmedMatches(confirmed);
    setPassedProfiles(passed);
    setShortlistedProfiles(shortlist);
    setShortlistedIds(slIds);

    const { data: blockRows } = await supabase.from("blocked_users").select("blocked_user_id").eq("user_id", currentUser.id);
    if (blockRows?.length) {
      const ids = blockRows.map((b) => b.blocked_user_id);
      const { data: blockedUsers } = await supabase.from("users").select(USERS_PROFILE_SELECT_PUBLIC).in("id", ids);
      setBlockedProfiles((blockedUsers ?? []).map((row) => mapSupabaseUserRow(row as Record<string, unknown>)));
    } else {
      setBlockedProfiles([]);
    }

    /* Sort newcomers by created_at desc (newest first) */
    const sortedNewcomers = newcomers
      .map((n) => {
        const { compatibility: _c, match_reasons: _m, ...rest } = n;
        return rest;
      })
      .sort((a, b) => {
        const ta = Date.parse(a.created_at ?? "0");
        const tb = Date.parse(b.created_at ?? "0");
        return tb - ta;
      });
    setNewcomerProfiles(sortedNewcomers);

    const ranked = discoveryRows.map((p) => ({
      ...p,
      compatibility: p.compatibility,
      finalCompatibilityScore: p.compatibility,
      baseCompatibility: p.compatibility,
      aiSpiritualScore: 0,
      matchReasons: p.match_reasons ?? [],
    })) as RankedMatch[];
    setProfiles(ranked);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await reloadHub();
      setLoading(false);
    };
    void run();
  }, [reloadHub]);

  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) {
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  /* ── counts for tab badges ── */
  const tabCounts = useMemo(() => {
    const discoveryCount = profiles.length;
    const invitationsCount = confirmedMatches.length + incoming.length + outgoing.length;
    const shortlistCount = shortlistedProfiles.length;
    const releasedCount = passedProfiles.length;
    const blockedCount = blockedProfiles.length;
    return {
      discovery: discoveryCount,
      invitations: invitationsCount,
      shortlist: shortlistCount,
      released: releasedCount,
      blocked: blockedCount,
    };
  }, [profiles, confirmedMatches, incoming, outgoing, shortlistedProfiles, passedProfiles, blockedProfiles]);

  /* ── uiProfiles (preserved) ── */
  const uiProfiles = useMemo(
    () =>
      profiles.map((profile) => ({
        id: profile.id,
        name: getDisplayName(profile),
        age: getProfileAge(profile),
        location: getProfileCity(profile),
        photo: getProfilePhotoUrl(profile),
        compatibility: profile.compatibility,
        guru: profile.guru ?? "Spiritual path",
        bio: profile.bio ?? "Seeking a conscious connection rooted in growth and devotion.",
        practices: profile.practices.length ? profile.practices : ["Daily Sadhana"],
        matchReasons: (profile.matchReasons ?? []).slice(0, 4),
      })),
    [profiles]
  );

  const hasProfiles = uiProfiles.length > 0;
  const m = hasProfiles ? uiProfiles[idx % uiProfiles.length] : null;

  const advance = () => setIdx((i) => i + 1);

  /* ── all handlers (preserved exactly) ── */
  const openChatWithMatch = async (otherUserId: string) => {
    if (!me?.id) {
      toast.error("Please sign in again.");
      return;
    }
    const { chatId, error } = await createOrGetChat(me.id, otherUserId);
    if (!chatId) {
      toast.error(error ?? "Could not open chat.");
      return;
    }
    navigate(`/app/chat/${chatId}`);
  };

  const handleAccept = async (senderId: string) => {
    if (!me?.id) {
      return;
    }
    const result = await acceptIncomingRequest(me.id, senderId);
    if (!result.ok) {
      if (result.reason === "limit_reached") {
        toast.error("Daily like limit reached. Upgrade to premium for unlimited likes.");
        return;
      }
      if (result.reason === "blocked") {
        toast.error("This profile is unavailable.");
        return;
      }
      toast.error(result.error ?? "Could not accept request.");
      return;
    }
    if (result.mutualMatch) {
      toast.success("It's a match!");
    } else {
      toast.success("Request accepted.");
    }
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handleRejectIncoming = async (senderId: string) => {
    if (!me?.id) {
      return;
    }
    const result = await rejectIncomingRequest(me.id, senderId);
    if (!result.ok) {
      toast.error(result.error ?? "Could not decline request.");
      return;
    }
    toast.success("Request released with grace.");
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handlePass = async (passedId: string) => {
    if (!me?.id) {
      return;
    }
    const result = await passUser(me.id, passedId);
    if (!result.ok) {
      toast.error(result.error ?? "Could not pass.");
      return;
    }
    advance();
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handleLike = async (likedId: string) => {
    if (!me?.id) {
      toast.error("Please sign in.");
      return;
    }
    const result = await likeUser(me.id, likedId);
    if (!result.ok) {
      if (result.reason === "limit_reached") {
        toast.error("Daily like limit reached. Upgrade to premium for unlimited likes.");
        return;
      }
      if (result.reason === "blocked") {
        toast.error("This profile is unavailable.");
        return;
      }
      if (result.reason === "unauthorized") {
        toast.error(result.error ?? "Please sign in again.");
        return;
      }
      toast.error(result.error ?? "Unable to send request.");
      return;
    }
    if (result.mutualMatch) {
      toast.success("It's a match!");
      const { chatId, error } = await createOrGetChat(me.id, likedId);
      if (chatId) {
        navigate(`/app/chat/${chatId}`);
        return;
      }
      toast.error(error ?? "Matched but chat could not open.");
      return;
    }
    toast.success("Request sent!");
    advance();
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handleSuperLike = async (likedId: string) => {
    if (!me?.id) {
      toast.error("Please sign in.");
      return;
    }
    const result = await superLikeUser(me.id, likedId);
    if (!result.ok) {
      if (result.reason === "limit_reached") {
        toast.error("Daily super-like limit reached. Upgrade to Sacred for unlimited.");
        return;
      }
      if (result.reason === "unauthorized") {
        toast.error(result.error ?? "Please sign in again.");
        return;
      }
      toast.error(result.error ?? "Could not send super-like.");
      return;
    }
    if (result.mutualMatch) {
      toast.success("Super match! They'll notice you.");
      const { chatId, error } = await createOrGetChat(me.id, likedId);
      if (chatId) {
        navigate(`/app/chat/${chatId}`);
        return;
      }
      toast.error(error ?? "Matched but chat could not open.");
      return;
    }
    toast.success("Super-like sent! They'll notice you.");
    advance();
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handleToggleShortlist = async (profileId: string) => {
    if (!me?.id) {
      return;
    }
    if (shortlistedIds.has(profileId)) {
      const r = await removeFromShortlist(me.id, profileId);
      if (!r.ok) {
        toast.error(r.error ?? "Could not update shortlist.");
        return;
      }
      toast.success("Removed from your shortlist.");
    } else {
      const r = await addToShortlist(me.id, profileId);
      if (!r.ok) {
        toast.error(r.error ?? "Could not shortlist.");
        return;
      }
      toast.success("Soul saved to your shortlist.");
    }
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const handleRemoveShortlistRow = async (profileId: string) => {
    if (!me?.id) {
      return;
    }
    const r = await removeFromShortlist(me.id, profileId);
    if (!r.ok) {
      toast.error(r.error ?? "Could not remove.");
      return;
    }
    toast.success("Removed from shortlist.");
    setLoading(true);
    await reloadHub();
    setLoading(false);
  };

  const confirmedIdsKey = useMemo(() => confirmedMatches.map((u) => u.id).sort().join(","), [confirmedMatches]);

  useEffect(() => {
    if (!me?.id || !confirmedIdsKey) {
      setMatchContacts(new Map());
      return;
    }
    let cancelled = false;
    const ids = confirmedIdsKey.split(",").filter(Boolean);
    void (async () => {
      const entries = await Promise.all(ids.map(async (oid) => [oid, await fetchMatchedContactFields(oid)] as const));
      if (!cancelled) {
        setMatchContacts(new Map(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me?.id, confirmedIdsKey]);

  /* ───────────────────────────────────────────────
     Render
     ─────────────────────────────────────────────── */

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title="Sambandh"
        subtitle="Where souls meet in quiet recognition."
      />

      <div className="px-5 space-y-8 pt-2">
        {/* ── Spiritual Tab Navigation ── */}
        <SoulTabs active={activeTab} onChange={setActiveTab} counts={tabCounts} />

        {/* ═══════════════════════════════════════════
            TAB: Discovery
            ═══════════════════════════════════════════ */}
        {activeTab === "discovery" && (
          <div className="animate-fade-in space-y-8">
            <FlowSection
              sectionId="discovery"
              variant="field"
              eyebrow="Open field"
              title="Discovery"
              description="Souls yet to greet. Swipe gently — left to release, right to invite, upward to bless."
              emptyText="The field is quiet now. Return after sadhana — new footsteps will appear."
              isEmpty={!loading && !hasProfiles}
              loading={loading}
            >
              <div className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-card animate-scale-in" style={{ touchAction: "pan-y" }}>
                {m ? (
                  <DiscoverySwipeSurface
                    disabled={loading}
                    onPass={() => void handlePass(m.id)}
                    onConnect={() => void handleLike(m.id)}
                    onBless={() => void handleSuperLike(m.id)}
                  >
                    <div className="relative h-full w-full">
                      <img src={m.photo} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 z-20">
                        <span className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-semibold text-primary flex items-center gap-1 shrink-0 border border-primary/10">
                          <Sparkles className="h-3 w-3" /> {m.compatibility}% aligned
                        </span>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Link
                            to={`/app/profile/${m.id}`}
                            className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium border border-border/50"
                          >
                            View profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleToggleShortlist(m.id)}
                            className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium flex items-center gap-1 border border-border/50"
                          >
                            <Bookmark className="h-3 w-3" fill={shortlistedIds.has(m.id) ? "currentColor" : "none"} />
                            {shortlistedIds.has(m.id) ? "Shortlisted" : "Shortlist"}
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-6 text-ivory z-10 pointer-events-none">
                        <h3 className="font-serif text-4xl leading-none">
                          {m.name}, {m.age}
                        </h3>
                        <p className="flex items-center gap-1.5 text-sm opacity-90 mt-2">
                          <MapPin className="h-3.5 w-3.5" /> {m.location}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-medium">{m.guru}</span>
                          {m.practices.slice(0, 2).map((p) => (
                            <span key={p} className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-[11px] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm mt-3 opacity-90 line-clamp-2 italic font-serif">&quot;{m.bio}&quot;</p>
                        {m.matchReasons?.length ? (
                          <ul className="mt-3 space-y-1 text-[11px] leading-snug opacity-90 border-t border-white/10 pt-3">
                            {m.matchReasons.slice(0, 3).map((reason) => (
                              <li key={reason} className="flex gap-2">
                                <span className="text-primary shrink-0" aria-hidden>
                                  ·
                                </span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </DiscoverySwipeSurface>
                ) : null}
              </div>

              {m ? (
                <>
                  <div className="flex justify-center gap-5 mt-6">
                    <button
                      type="button"
                      onClick={() => void handlePass(m.id)}
                      className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-[1.04] transition-transform duration-300"
                    >
                      <X className="h-6 w-6 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleLike(m.id)}
                      className="h-16 w-16 rounded-full bg-gradient-saffron shadow-warm grid place-items-center hover:scale-[1.04] transition-transform duration-300"
                    >
                      <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSuperLike(m.id)}
                      className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-[1.04] transition-transform duration-300"
                    >
                      <Star className="h-6 w-6 text-accent" fill="currentColor" />
                    </button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-4 italic leading-relaxed">
                    Soft gestures on the portrait echo these same intentions
                  </p>
                </>
              ) : null}
            </FlowSection>

            {/* New Souls inline within Discovery */}
            {newcomerProfiles.length > 0 && (
              <FlowSection
                sectionId="new-souls"
                variant="field"
                eyebrow="Fresh footsteps"
                title="New Souls"
                emptyText=""
                isEmpty={false}
                loading={loading}
              >
                {newcomerProfiles.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-border/50 bg-card/50 p-5 flex flex-col gap-3 shadow-soft">
                    {soulRow(u)}
                    <Link to={`/app/profile/${u.id}`} className="text-xs text-primary font-medium hover:underline">
                      Open profile
                    </Link>
                  </div>
                ))}
              </FlowSection>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Invitations
            ═══════════════════════════════════════════ */}
        {activeTab === "invitations" && (
          <div className="animate-fade-in space-y-6">
            <Accordion
              type="multiple"
              defaultValue={["knocking", "offered", "mutual"]}
              className="space-y-3"
            >
              {/* ── Knocking Souls: received invitations ── */}
              <AccordionItem value="knocking" className="rounded-2xl border border-border/55 bg-card/25 px-1 sm:px-2">
                <AccordionTrigger className="font-serif text-lg px-3 hover:no-underline">
                  Knocking Souls
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4 px-1">
                  <FlowSection
                    sectionId="soul-invitations-received"
                    variant="threshold"
                    eyebrow="At your threshold"
                    title="Invitations received"
                    emptyText="No one is waiting at your door. Your presence in the sangha is enough."
                    isEmpty={!loading && incoming.length === 0}
                    loading={loading}
                  >
                    {incoming.map((u) => (
                      <div key={u.id} className="rounded-2xl border border-border/50 bg-card/60 p-5 flex flex-col gap-4 shadow-soft">
                        {soulRow(u)}
                        <div className="grid grid-cols-2 gap-3">
                          <Button type="button" variant="outline" className="h-12 border-border/60 bg-card" onClick={() => void handleRejectIncoming(u.id)}>
                            Release
                          </Button>
                          <Button type="button" className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm" onClick={() => void handleAccept(u.id)}>
                            <Check className="h-4 w-4 mr-2" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))}
                  </FlowSection>
                </AccordionContent>
              </AccordionItem>

              {/* ── Offered in Faith: sent invitations ── */}
              <AccordionItem value="offered" className="rounded-2xl border border-border/55 bg-card/25 px-1 sm:px-2">
                <AccordionTrigger className="font-serif text-lg px-3 hover:no-underline">
                  Offered in Faith
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4 px-1">
                  <FlowSection
                    sectionId="invitations-sent"
                    variant="threshold"
                    eyebrow="Awaiting response"
                    title="Invitations sent"
                    emptyText="You have not offered a connection yet. Discovery is where the first step lives."
                    isEmpty={!loading && outgoing.length === 0}
                    loading={loading}
                  >
                    {outgoing.map((u) => (
                      <div key={u.id} className="rounded-2xl border border-border/50 bg-card/50 p-5 flex flex-col gap-3 shadow-soft">
                        {soulRow(u)}
                        <p className="text-xs text-muted-foreground">Awaiting their response — trust the timing.</p>
                      </div>
                    ))}
                  </FlowSection>
                </AccordionContent>
              </AccordionItem>

              {/* ── Mutual Recognition: accepted matches ── */}
              <AccordionItem value="mutual" className="rounded-2xl border border-primary/15 bg-card/20 px-1 sm:px-2">
                <AccordionTrigger className="font-serif text-lg px-3 hover:no-underline">
                  Mutual Recognition
                </AccordionTrigger>
                <AccordionContent className="pb-4 px-1">
                  <FlowSection
                    sectionId="sacred-connections"
                    variant="bond"
                    eyebrow="Both hearts said yes"
                    title="Accepted matches"
                    description="Dialogue opens here. Contact channels appear only if they chose to share."
                    emptyText="When two hearts align, they will appear here. Until then, keep walking in truth."
                    isEmpty={!loading && confirmedMatches.length === 0}
                    loading={loading}
                  >
                    {confirmedMatches.map((u) => {
                      const c = matchContacts.get(u.id);
                      const waDigits = c?.whatsapp ? c.whatsapp.replace(/\D/g, "") : "";
                      return (
                        <div key={u.id} className="rounded-2xl border border-primary/15 bg-card/70 p-5 flex flex-col gap-3 shadow-card">
                          {soulRow(u)}
                          <div className="grid gap-2">
                            <Button
                              type="button"
                              className="h-12 w-full bg-gradient-saffron text-primary-foreground shadow-warm"
                              onClick={() => void openChatWithMatch(u.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" /> Open chat
                            </Button>
                            {c?.whatsapp && waDigits.length >= 8 ? (
                              <a
                                href={`https://wa.me/${waDigits}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-11 w-full rounded-xl border border-border/60 bg-card text-sm font-medium grid place-items-center hover:bg-secondary/40 transition-colors"
                              >
                                WhatsApp
                              </a>
                            ) : null}
                            {c?.whatsapp ? (
                              <a
                                href={`tel:${c.whatsapp.replace(/[^\d+]/g, "")}`}
                                className="h-11 w-full rounded-xl border border-border/60 bg-card text-sm font-medium grid place-items-center hover:bg-secondary/40 transition-colors inline-flex items-center justify-center gap-2"
                              >
                                <Phone className="h-4 w-4" /> Call
                              </a>
                            ) : null}
                            {c?.allowVideoCall ? (
                              <p className="text-[10px] text-center text-muted-foreground">They are open to video when you both feel ready.</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </FlowSection>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Shortlisted
            ═══════════════════════════════════════════ */}
        {activeTab === "shortlist" && (
          <div className="animate-fade-in">
            <FlowSection
              sectionId="shortlisted-souls"
              variant="keep"
              eyebrow="Held gently"
              title="Shortlisted souls"
              description="Souls kept close for later reflection."
              emptyText="Shortlist a soul from Discovery to keep their light close while you discern."
              isEmpty={!loading && shortlistedProfiles.length === 0}
              loading={loading}
            >
              {shortlistedProfiles.map((u) => (
                <div key={u.id} className="rounded-2xl border border-accent/20 bg-card/55 p-5 flex flex-col gap-3 shadow-soft">
                  {soulRow(u)}
                  <Button type="button" variant="outline" className="h-11 border-border/60 bg-card" onClick={() => void handleRemoveShortlistRow(u.id)}>
                    Remove from shortlist
                  </Button>
                </div>
              ))}
            </FlowSection>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Released
            ═══════════════════════════════════════════ */}
        {activeTab === "released" && (
          <div className="animate-fade-in">
            <FlowSection
              sectionId="passed-souls"
              variant="release"
              eyebrow="Released with respect"
              title="Passed souls"
              description="Profiles you passed or gently declined — kept here so the threads stay visible."
              emptyText="No passes yet. Every boundary you hold matters."
              isEmpty={!loading && passedProfiles.length === 0}
              loading={loading}
            >
              <div className="max-h-[min(28rem,60vh)] overflow-y-auto space-y-3 pr-1">
                {passedProfiles.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-border/45 bg-background/50 p-5 shadow-soft">
                    {soulRow(u)}
                  </div>
                ))}
              </div>
            </FlowSection>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            TAB: Dusht Aatmaye (Blocked)
            ═══════════════════════════════════════════ */}
        {activeTab === "blocked" && (
          <div className="animate-fade-in">
            <FlowSection
              sectionId="blocked-souls"
              variant="release"
              eyebrow="Boundary held"
              title="Dusht Aatmaye"
              description="Souls you have asked to rest apart. Unblock from Settings whenever compassion invites a new chapter."
              emptyText="You have not blocked anyone. May your boundaries stay clear and kind."
              isEmpty={!loading && blockedProfiles.length === 0}
              loading={loading}
            >
              {blockedProfiles.map((u) => (
                <div key={u.id} className="rounded-2xl border border-border/45 bg-background/50 p-5 shadow-soft">
                  {soulRow(u)}
                  <Link to="/app/settings" className="text-xs text-primary mt-2 inline-block hover:underline">
                    Manage in Settings
                  </Link>
                </div>
              ))}
            </FlowSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
