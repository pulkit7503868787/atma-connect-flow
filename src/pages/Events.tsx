<<<<<<< HEAD
import { PageHeader } from "@/components/PageHeader";
import retreat from "@/assets/event-retreat.jpg";
import satsang from "@/assets/event-satsang.jpg";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { getAllProfilesExceptMe, getDisplayName, getProfileCity, type UserProfileWithCompatibility } from "@/lib/db";
=======
import { events } from "@/data/dummy";
import { PageHeader } from "@/components/PageHeader";
import retreat from "@/assets/event-retreat.jpg";
import satsang from "@/assets/event-satsang.jpg";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682

const imgMap: Record<string, string> = { retreat, satsang };

const Events = () => {
<<<<<<< HEAD
  const [profiles, setProfiles] = useState<UserProfileWithCompatibility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getAllProfilesExceptMe();
      setProfiles(data);
      setLoading(false);
    };

    void load();
  }, []);

  const events = useMemo(
    () =>
      profiles.map((profile, i) => ({
        id: profile.id,
        title: `${getDisplayName(profile)}'s Satsang Circle`,
        date: new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        location: getProfileCity(profile),
        attendees: 30 + i * 12,
        image: i % 2 === 0 ? "retreat" : "satsang",
      })),
    [profiles]
  );

=======
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682
  return (
    <div className="animate-fade-in">
      <PageHeader title="Gatherings" subtitle="Satsangs · retreats · pilgrimages" />

      <div className="px-5">
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none -mx-5 px-5">
          {["All", "Satsang", "Retreat", "Online", "Pilgrimage"].map((t, i) => (
            <button key={t} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              i === 0 ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}>{t}</button>
          ))}
        </div>

        <div className="space-y-5">
<<<<<<< HEAD
          {loading && <p className="text-sm text-muted-foreground">Loading events...</p>}
          {!loading && events.length === 0 && <p className="text-sm text-muted-foreground">No events available yet.</p>}
=======
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682
          {events.map((e, i) => (
            <article key={e.id} className="rounded-2xl overflow-hidden bg-card shadow-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="relative aspect-[16/10]">
                <img src={imgMap[e.image]} alt={e.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-[11px] font-semibold text-primary">
                  {e.date}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-2xl leading-tight">{e.title}</h3>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.attendees}</span>
                </div>
                <Button className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11">
                  Reserve seat
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
