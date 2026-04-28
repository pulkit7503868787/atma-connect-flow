import { useParams, Link } from "react-router-dom";
import { matches } from "@/data/dummy";
import { ArrowLeft, MapPin, Sparkles, Heart, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { id } = useParams();
  const m = matches.find((x) => x.id === id) || { ...matches[0], name: "Ananya Sharma", bio: "Walking the path of bhakti, breath, and being.", compatibility: 0 } as any;
  const isOwn = !id;
  const profile = isOwn ? { ...matches[0], name: "Ananya Sharma", bio: "On the path of self-realization. Daily sadhak, lover of poetry and pilgrimage.", compatibility: 0 } as any : m;

  return (
    <div className="animate-fade-in pb-8">
      <div className="relative aspect-[4/5]">
        <img src={profile.photo} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/20" />
        <Link to={isOwn ? "/app" : "/app/matches"} className="absolute top-6 left-5 h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        {isOwn && (
          <Link to="/app/subscription" className="absolute top-6 right-5 h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center">
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="-mt-20 relative px-5">
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl leading-none">{profile.name}{!isOwn && `, ${profile.age}`}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5" /> {profile.location}
              </p>
            </div>
            {!isOwn && (
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {profile.compatibility}%
              </span>
            )}
          </div>

          <p className="font-serif italic text-lg mt-4 leading-snug text-foreground/90">"{profile.bio}"</p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Field label="Guru" value={profile.guru} />
            <Field label="Practice" value={profile.practice} />
            <Field label="Diet" value="Sattvic" />
            <Field label="Lifestyle" value="Ashram-stay" />
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Daily practices</p>
            <div className="flex flex-wrap gap-2">
              {profile.practices.map((p: string) => (
                <span key={p} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{p}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {matches.slice(0, 3).map((p) => (
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                <img src={p.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {!isOwn && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 border-border/60 bg-card">
              <Heart className="h-4 w-4 mr-2 text-primary" /> Bless
            </Button>
            <Button asChild className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
              <Link to="/app/chat/1"><MessageCircle className="h-4 w-4 mr-2" /> Connect</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-medium mt-0.5">{value}</p>
  </div>
);

export default Profile;
