import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Heart, X, Star, MapPin, Sparkles, MessageCircle, Check, Bookmark } from "lucide-react";
import {
  getDisplayName,
  getCurrentUserProfile,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  getDiscoverySuggestionsExceptRelations,
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

function FlowSection({
  sectionId,
  eyebrow,
  title,
  description,
  emptyText,
  isEmpty,
  loading,
  children,
}: {
  sectionId: string;
  eyebrow: string;
  title: string;
  description?: string;
  emptyText: string;
  isEmpty: boolean;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <section id={sectionId} className="scroll-mt-24 space-y-3">
      <div className="px-1">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="font-serif text-xl mt-1">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground px-1">Loading…</p>
      ) : isEmpty ? (
        <div className="glass-card rounded-2xl p-6 shadow-card text-center text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </section>
  );
}

const Matches = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profiles, setProfiles] = useState<RankedMatch[]>([]);
  const [incoming, setIncoming] = useState<MatchingUser[]>([]);
  const [outgoing, setOutgoing] = useState<MatchingUser[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<MatchingUser[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<MatchingUser[]>([]);
  const [shortlistedProfiles, setShortlistedProfiles] = useState<MatchingUser[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

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
      setProfiles([]);
      return;
    }
    const [received, sent, discoveryRows, confirmed, passed, shortlist, slIds] = await Promise.all([
      getReceivedRequests(currentUser.id),
      getSentRequests(currentUser.id),
      getDiscoverySuggestionsExceptRelations(),
      getMatches(currentUser.id),
      getPassedProfilesForUser(currentUser.id),
      getShortlistedProfiles(currentUser.id),
      getShortlistedUserIds(currentUser.id),
    ]);
    setIncoming(received.users);
    setOutgoing(sent);
    setConfirmedMatches(confirmed);
    setPassedProfiles(passed);
    setShortlistedProfiles(shortlist);
    setShortlistedIds(slIds);

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

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Connections" subtitle="Discovery, soul requests, and sacred bonds" />

      <div className="px-5 space-y-12 pt-2">
        <FlowSection
          sectionId="discovery"
          eyebrow="Step one"
          title="Discovery"
          description="Souls you have not yet greeted, passed, or paired with."
          emptyText="No new souls in the circle right now. Return after sadhana — the field will refresh."
          isEmpty={!loading && !hasProfiles}
          loading={loading}
        >
          <div className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-card animate-scale-in">
            {m ? (
              <>
                <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-semibold text-primary flex items-center gap-1 shrink-0">
                    <Sparkles className="h-3 w-3" /> {m.compatibility}% aligned
                  </span>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Link to={`/app/profile/${m.id}`} className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium">
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleToggleShortlist(m.id)}
                      className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium flex items-center gap-1"
                    >
                      <Bookmark className="h-3 w-3" fill={shortlistedIds.has(m.id) ? "currentColor" : "none"} />
                      {shortlistedIds.has(m.id) ? "Shortlisted" : "Shortlist"}
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-6 text-ivory">
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
              </>
            ) : null}
          </div>

          {m ? (
            <>
              <div className="flex justify-center gap-5 mt-6">
                <button
                  type="button"
                  onClick={() => void handlePass(m.id)}
                  className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform"
                >
                  <X className="h-6 w-6 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleLike(m.id)}
                  className="h-16 w-16 rounded-full bg-gradient-saffron shadow-warm grid place-items-center hover:scale-110 transition-transform"
                >
                  <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleSuperLike(m.id)}
                  className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform"
                >
                  <Star className="h-6 w-6 text-accent" fill="currentColor" />
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4 italic">Pass · Connect · Super-bless</p>
            </>
          ) : null}
        </FlowSection>

        <FlowSection
          sectionId="soul-requests"
          eyebrow="Awaiting your heart"
          title="Soul requests"
          description="Incoming invitations — accept to open the path, or release with kindness."
          emptyText="No soul is knocking at your door yet. Your presence in the sangha is enough."
          isEmpty={!loading && incoming.length === 0}
          loading={loading}
        >
          {incoming.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-4">
              {soulRow(u)}
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-12 border-border/60 bg-card" onClick={() => void handleRejectIncoming(u.id)}>
                  Reject
                </Button>
                <Button type="button" className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm" onClick={() => void handleAccept(u.id)}>
                  <Check className="h-4 w-4 mr-2" /> Accept
                </Button>
              </div>
            </div>
          ))}
        </FlowSection>

        <FlowSection
          sectionId="sent-invitations"
          eyebrow="Offered in faith"
          title="Sent invitations"
          description="Requests you have sent — the other soul has not yet answered."
          emptyText="You have not offered a connection yet. Discovery is where the first step lives."
          isEmpty={!loading && outgoing.length === 0}
          loading={loading}
        >
          {outgoing.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-3">
              {soulRow(u)}
              <p className="text-xs text-muted-foreground">Awaiting their response — trust the timing.</p>
            </div>
          ))}
        </FlowSection>

        <FlowSection
          sectionId="sacred-connections"
          eyebrow="Mutual recognition"
          title="Sacred connections"
          description="Matched souls — chat is open between you."
          emptyText="When two hearts align, they will appear here. Until then, keep walking in truth."
          isEmpty={!loading && confirmedMatches.length === 0}
          loading={loading}
        >
          {confirmedMatches.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-3">
              {soulRow(u)}
              <Button
                type="button"
                className="h-12 w-full bg-gradient-saffron text-primary-foreground shadow-warm"
                onClick={() => void openChatWithMatch(u.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Open Chat
              </Button>
            </div>
          ))}
        </FlowSection>

        <FlowSection
          sectionId="passed-souls"
          eyebrow="Released with respect"
          title="Passed souls"
          description="Profiles you passed or gently declined — they rest outside Discovery for now."
          emptyText="No passes yet. Every boundary you hold is sacred."
          isEmpty={!loading && passedProfiles.length === 0}
          loading={loading}
        >
          {passedProfiles.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card">
              {soulRow(u)}
            </div>
          ))}
        </FlowSection>

        <FlowSection
          sectionId="shortlist"
          eyebrow="Held in your heart"
          title="Shortlisted"
          description="Souls you marked to revisit — they stay here and step out of Discovery until you release them."
          emptyText="Shortlist a soul from Discovery to keep their light close while you discern."
          isEmpty={!loading && shortlistedProfiles.length === 0}
          loading={loading}
        >
          {shortlistedProfiles.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-3">
              {soulRow(u)}
              <Button type="button" variant="outline" className="h-11 border-border/60 bg-card" onClick={() => void handleRemoveShortlistRow(u.id)}>
                Remove from shortlist
              </Button>
            </div>
          ))}
        </FlowSection>
      </div>
    </div>
  );
};

export default Matches;
