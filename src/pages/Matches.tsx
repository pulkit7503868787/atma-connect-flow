import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Heart, X, Star, MapPin, Sparkles } from "lucide-react";
import {
  getDisplayName,
  getCurrentUserProfile,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
} from "@/lib/db";
import { getConfirmedMatchesForUser, type RankedMatch } from "@/lib/matching";

const Matches = () => {
  const [profiles, setProfiles] = useState<RankedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      const currentUser = await getCurrentUserProfile();
      if (!currentUser) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const data = await getConfirmedMatchesForUser(currentUser);
      setProfiles(data);
      setLoading(false);
    };

    void loadProfiles();
  }, []);

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

  return (
    <div className="animate-fade-in">
      <PageHeader title="Matches" subtitle="Souls that resonate with yours" />

      <div className="px-5 relative">
        {loading && <p className="text-center text-sm text-muted-foreground py-24">Loading matches...</p>}
        {!loading && !m && <p className="text-center text-sm text-muted-foreground py-24">No matches yet. Check back soon.</p>}
        {m && <div key={m.id} className="relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-card animate-scale-in">
          <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <span className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-semibold text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {m.compatibility}% aligned
            </span>
            <Link to={`/app/profile/${m.id}`} className="px-3 py-1.5 rounded-full bg-background/95 backdrop-blur text-xs font-medium">View profile</Link>
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 text-ivory">
            <h2 className="font-serif text-4xl leading-none">{m.name}, {m.age}</h2>
            <p className="flex items-center gap-1.5 text-sm opacity-90 mt-2">
              <MapPin className="h-3.5 w-3.5" /> {m.location}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[11px] font-medium">{m.guru}</span>
              {m.practices.slice(0, 2).map((p) => (
                <span key={p} className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-white text-[11px] font-medium">{p}</span>
              ))}
            </div>
            <p className="text-sm mt-3 opacity-90 line-clamp-2 italic font-serif">"{m.bio}"</p>
          </div>
        </div>}

        <div className="flex justify-center gap-5 mt-8">
          <button onClick={advance} className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
          <button onClick={advance} className="h-16 w-16 rounded-full bg-gradient-saffron shadow-warm grid place-items-center hover:scale-110 transition-transform">
            <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
          </button>
          <button onClick={advance} className="h-14 w-14 rounded-full bg-card border border-border shadow-soft grid place-items-center hover:scale-110 transition-transform">
            <Star className="h-6 w-6 text-accent" fill="currentColor" />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 italic">Pass · Connect · Super-bless</p>
      </div>
    </div>
  );
};

export default Matches;
