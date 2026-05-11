import { PageHeader } from "@/components/PageHeader";
import retreat from "@/assets/event-retreat.jpg";
import satsang from "@/assets/event-satsang.jpg";
import { MapPin, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getEvents, getRsvpCount, getMyRsvp, rsvpToEvent, type EventItem } from "@/lib/events";
import { toast } from "sonner";

const imgMap: Record<string, string> = { retreat, satsang };

const categories = ["All", "Satsang", "Retreat", "Online", "Pilgrimage"];

const Events = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [myRsvps, setMyRsvps] = useState<Record<string, string>>({});
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  const loadEvents = async (cat?: string) => {
    setLoading(true);
    const data = await getEvents(cat === "All" ? undefined : cat);
    setEvents(data);

    const counts: Record<string, number> = {};
    const myStatuses: Record<string, string> = {};
    await Promise.all(
      data.map(async (ev) => {
        const [count, myRsvp] = await Promise.all([getRsvpCount(ev.id), getMyRsvp(ev.id)]);
        counts[ev.id] = count;
        if (myRsvp) myStatuses[ev.id] = myRsvp.status;
      })
    );
    setRsvpCounts(counts);
    setMyRsvps(myStatuses);
    setLoading(false);
  };

  useEffect(() => {
    void loadEvents(filter);
  }, [filter]);

  const handleRsvp = async (eventId: string) => {
    const isGoing = myRsvps[eventId] === "going";
    const nextStatus = isGoing ? "cancelled" : "going";
    setRsvpLoading(eventId);
    const result = await rsvpToEvent(eventId, nextStatus);
    setRsvpLoading(null);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update RSVP.");
      return;
    }
    setMyRsvps((prev) => ({ ...prev, [eventId]: nextStatus }));
    setRsvpCounts((prev) => ({
      ...prev,
      [eventId]: isGoing ? Math.max(0, (prev[eventId] ?? 0) - 1) : (prev[eventId] ?? 0) + 1,
    }));
    toast.success(isGoing ? "RSVP cancelled." : "You're going!");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gatherings" subtitle="Satsangs · retreats · pilgrimages" />

      <div className="px-5">
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none -mx-5 px-5">
          {categories.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === t ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {loading && <p className="text-sm text-muted-foreground">Loading events...</p>}
          {!loading && events.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No events available yet.</p>}
          {events.map((e, i) => (
            <article key={e.id} className="rounded-2xl overflow-hidden bg-card shadow-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="relative aspect-[16/10]">
                <img src={imgMap[e.image]} alt={e.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/95 backdrop-blur text-[11px] font-semibold text-primary">
                  {formatDate(e.event_date)}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold">
                  {e.type}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-2xl leading-tight">{e.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {rsvpCounts[e.id] ?? 0} / {e.max_attendees}</span>
                </div>
                <Button
                  onClick={() => void handleRsvp(e.id)}
                  disabled={rsvpLoading === e.id}
                  className={`w-full mt-4 h-11 transition-all ${
                    myRsvps[e.id] === "going"
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {rsvpLoading === e.id ? "..." : myRsvps[e.id] === "going" ? <><Check className="h-4 w-4 mr-2" /> Going</> : "Reserve seat"}
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
