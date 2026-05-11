import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Heart, X, Star, MapPin, Sparkles, MessageCircle, Check } from "lucide-react";
import {
  getDisplayName,
  getCurrentUserProfile,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  getDiscoverySuggestionsExceptRelations,
  type UserProfile,
  type UserProfileWithCompatibility,
} from "@/lib/db";
import { type RankedMatch, type MatchingUser } from "@/lib/matching";
import { acceptIncomingRequest, getMatches, getReceivedRequests, getSentRequests, rejectIncomingRequest, passUser, superLikeUser } from "@/lib/likes";
import { createOrGetChat } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Matches = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");

  const [profiles, setProfiles] = useState<RankedMatch[]>([]);
  const [suggested, setSuggested] = useState<UserProfileWithCompatibility[]>([]);
  const [incoming, setIncoming] = useState<MatchingUser[]>([]);
  const [outgoing, setOutgoing] = useState<MatchingUser[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<MatchingUser[]>([]);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  const reloadListViews = useCallback(async () => {
    const currentUser = await getCurrentUserProfile();
    setMe(currentUser);
    if (!currentUser) {
      setIncoming([]);
      setOutgoing([]);
      setSuggested([]);
      setConfirmedMatches([]);
      return;
    }
    const [received, sent, allOthers, confirmed] = await Promise.all([
      getReceivedRequests(currentUser.id),
      getSentRequests(currentUser.id),
      getDiscoverySuggestionsExceptRelations(),
      getMatches(currentUser.id),
    ]);
    setIncoming(received.users);
    setOutgoing(sent);
    setSuggested(allOthers);
    setConfirmedMatches(confirmed);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const currentUser = await getCurrentUserProfile();
      setMe(currentUser);

      if (view === "received" || view === "sent" || view === "suggestions") {
        await reloadListViews();
        setLoading(false);
        return;
      }

      if (!currentUser) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const [data, confirmed] = await Promise.all([
        getDiscoverySuggestionsExceptRelations(),
        getMatches(currentUser.id),
      ]);

      setConfirmedMatches(confirmed);

      const filtered = data.map((p) => ({
          ...p,
          compatibility: p.compatibility,
          finalCompatibilityScore: p.compatibility,
          baseCompatibility: p.compatibility,
          aiSpiritualScore: 0,
          matchReasons: [] as string[],
        }));

      setProfiles(filtered as RankedMatch[]);
      setLoading(false);
    };

    void run();
  }, [view, reloadListViews]);

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
    await reloadListViews();
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
    toast.success("Request ignored.");
    await reloadListViews();
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
  };

  const handleLike = async (likedId: string) => {
    if (!me?.id) {
      toast.error("Please sign in.");
      return;
    }
    const { likeUser } = await import("@/lib/likes");
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
  };

  if (view === "received") {
    return (
      <div className="animate-fade-in pb-24">
        <PageHeader title="Received" subtitle="Souls reaching toward you" back />
        <div className="px-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && incoming.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">No pending requests.</p>
          )}
          {!loading &&
            incoming.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-4">
                <Link to={`/app/profile/${u.id}`} className="flex items-center gap-3">
                  <img
                    src={getProfilePhotoUrl(u)}
                    alt={getDisplayName(u)}
                    className="h-14 w-14 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <p className="font-medium truncate">{getDisplayName(u)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getProfileAge(u)}, {getProfileCity(u)}
                    </p>
                  </div>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-border/60 bg-card"
                    onClick={() => void handleRejectIncoming(u.id)}
                  >
                    Reject
                  </Button>
                  <Button type="button" className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm" onClick={() => void handleAccept(u.id)}>
                    <Check className="h-4 w-4 mr-2" /> Accept
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (view === "sent") {
    return (
      <div className="animate-fade-in pb-24">
        <PageHeader title="Sent" subtitle={"Requests you've offered"} back />
        <div className="px-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && outgoing.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">No outgoing requests.</p>
          )}
          {!loading &&
            outgoing.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-3">
                <Link to={`/app/profile/${u.id}`} className="flex items-center gap-3">
                  <img
                    src={getProfilePhotoUrl(u)}
                    alt={getDisplayName(u)}
                    className="h-14 w-14 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <p className="font-medium truncate">{getDisplayName(u)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getProfileAge(u)}, {getProfileCity(u)}
                    </p>
                  </div>
                </Link>
                <p className="text-xs text-muted-foreground">Awaiting their response</p>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (view === "suggestions") {
    const cards = suggested.map((p) => ({
      id: p.id,
      compatibility: p.compatibility,
      name: getDisplayName(p),
      age: getProfileAge(p),
      location: getProfileCity(p),
      photo: getProfilePhotoUrl(p),
    }));

    return (
      <div className="animate-fade-in pb-24">
        <PageHeader title="Suggested" subtitle="For you" back />
        <div className="flex gap-4 overflow-x-auto -mx-5 px-5 pb-4 snap-x snap-mandatory scrollbar-none">
          {loading && <p className="text-sm text-muted-foreground px-5">Loading…</p>}
          {!loading &&
            cards.map((item) => (
              <Link key={item.id} to={`/app/profile/${item.id}`} className="snap-start shrink-0 w-44 group">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-card">
                  <img src={item.photo} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-xs font-semibold text-primary">
                    {item.compatibility}%
                  </span>
                  <div className="absolute bottom-0 inset-x-0 p-3 text-ivory">
                    <p className="font-serif text-lg leading-none">
                      {item.name}, {item.age}
                    </p>
                    <p className="text-xs opacity-90 mt-1">{item.location}</p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Matches" subtitle="Souls that resonate with yours" />

      <div className="px-5 pb-6 space-y-4">
        {!loading && confirmedMatches.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sacred connections</p>
            {confirmedMatches.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-5 shadow-card flex flex-col gap-3">
                <Link to={`/app/profile/${u.id}`} className="flex items-center gap-3">
                  <img
                    src={getProfilePhotoUrl(u)}
                    alt={getDisplayName(u)}
                    className="h-14 w-14 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 text-left">
                    <p className="font-medium truncate">{getDisplayName(u)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getProfileAge(u)}, {getProfileCity(u)}
                    </p>
                  </div>
                </Link>
                <Button
                  type="button"
                  className="h-12 w-full bg-gradient-saffron text-primary-foreground shadow-warm"
                  onClick={() => void openChatWithMatch(u.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Open Chat
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 relative">
        {loading && <p className="text-center text-sm text-muted-foreground py-24">Loading matches...</p>}
        {!loading && !m && <p className="text-center text-sm text-muted-foreground py-24">No matches yet. Check back soon.</p>}
        {m && (
          <div key={m.id} className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-card animate-scale-in">
            <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <span className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-semibold text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {m.compatibility}% aligned
              </span>
              <Link to={`/app/profile/${m.id}`} className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium">
                View profile
              </Link>
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 text-ivory">
              <h2 className="font-serif text-4xl leading-none">
                {m.name}, {m.age}
              </h2>
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
            </div>
          </div>
        )}

        <div className="flex justify-center gap-5 mt-8">
          <button
            type="button"
            onClick={() => m && void handlePass(m.id)}
            className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform"
          >
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => m && void handleLike(m.id)}
            className="h-16 w-16 rounded-full bg-gradient-saffron shadow-warm grid place-items-center hover:scale-110 transition-transform"
          >
            <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={() => m && void handleSuperLike(m.id)}
            className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform"
          >
            <Star className="h-6 w-6 text-accent" fill="currentColor" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 italic">Pass · Connect · Super-bless</p>
      </div>
    </div>
  );
};

export default Matches;
