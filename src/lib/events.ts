import { supabase } from "@/lib/supabaseClient";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  type: "Satsang" | "Retreat" | "Online" | "Pilgrimage";
  location: string;
  event_date: string;
  max_attendees: number;
  image: string;
  created_by: string;
  created_at: string;
};

export type EventRsvp = {
  id: string;
  event_id: string;
  user_id: string;
  status: "going" | "maybe" | "cancelled";
  created_at: string;
};

const seedEvents = (): EventItem[] => [
  {
    id: "seed-1",
    title: "Full Moon Satsang",
    description: "An evening of chanting, meditation, and heart-sharing under the full moon. Open to all seekers on the path.",
    type: "Satsang",
    location: "Rishikesh, Uttarakhand",
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 50,
    image: "satsang",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "7-Day Silent Retreat",
    description: "A deep dive into silence, self-inquiry, and Vipassana practice. Guided sessions with experienced teachers.",
    type: "Retreat",
    location: "Dharamshala, Himachal Pradesh",
    event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 20,
    image: "retreat",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-3",
    title: "Online Kriya Yoga Workshop",
    description: "Learn the ancient techniques of Kriya Yoga from the comfort of your home. Live sessions with Q&A.",
    type: "Online",
    location: "Online (Zoom)",
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 200,
    image: "satsang",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-4",
    title: "Ganga Arati Pilgrimage",
    description: "A sacred journey to witness the divine Ganga Arati at Triveni Ghat. Includes guided temple visits.",
    type: "Pilgrimage",
    location: "Varanasi, Uttar Pradesh",
    event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 30,
    image: "retreat",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-5",
    title: "Bhakti Kirtan Evening",
    description: "An evening of devotional singing, dancing, and heart-opening chants. Bring your instruments and voice!",
    type: "Satsang",
    location: "Pune, Maharashtra",
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 40,
    image: "satsang",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
  {
    id: "seed-6",
    title: "10-Day Vipassana Retreat",
    description: "Traditional Vipassana meditation retreat following the teachings of S.N. Goenka. Noble silence throughout.",
    type: "Retreat",
    location: "Bangalore, Karnataka",
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    max_attendees: 30,
    image: "retreat",
    created_by: "system",
    created_at: new Date().toISOString(),
  },
];

export const getEvents = async (typeFilter?: string): Promise<EventItem[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("id,title,description,type,location,event_date,max_attendees,image,created_by,created_at")
    .order("event_date", { ascending: true });

  if (error || !data?.length) {
    return seedEvents();
  }

  if (typeFilter && typeFilter !== "All") {
    return data.filter((e) => e.type === typeFilter) as EventItem[];
  }
  return data as EventItem[];
};

export const getRsvpCount = async (eventId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");

  if (error) return 0;
  return count ?? 0;
};

export const getMyRsvp = async (eventId: string): Promise<EventRsvp | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("event_rsvps")
    .select("id,event_id,user_id,status,created_at")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as EventRsvp;
};

export const rsvpToEvent = async (
  eventId: string,
  status: "going" | "maybe" | "cancelled"
): Promise<{ ok: boolean; error?: string | null }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const { error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
};