import p1 from "@/assets/profile-1.jpg";
import p2 from "@/assets/profile-2.jpg";
import p3 from "@/assets/profile-3.jpg";
import p4 from "@/assets/profile-4.jpg";

export const gurus = [
  { id: "sadhguru", name: "Sadhguru", tradition: "Isha Yoga" },
  { id: "amma", name: "Mata Amritanandamayi", tradition: "Bhakti" },
  { id: "art-of-living", name: "Sri Sri Ravi Shankar", tradition: "Art of Living" },
  { id: "osho", name: "Osho", tradition: "Meditation" },
  { id: "ramana", name: "Ramana Maharshi", tradition: "Advaita" },
  { id: "iskcon", name: "Srila Prabhupada", tradition: "ISKCON" },
  { id: "yogananda", name: "Paramahansa Yogananda", tradition: "Kriya Yoga" },
  { id: "sai", name: "Sathya Sai Baba", tradition: "Universal Love" },
];

export const meditationTypes = [
  { id: "vipassana", label: "Vipassana", icon: "🧘" },
  { id: "mantra", label: "Mantra Japa", icon: "📿" },
  { id: "kriya", label: "Kriya Yoga", icon: "🌬️" },
  { id: "mindfulness", label: "Mindfulness", icon: "🌸" },
  { id: "bhakti", label: "Bhakti", icon: "🪔" },
  { id: "silence", label: "Silence", icon: "🤫" },
];

export const practices = [
  { id: "yoga", label: "Daily Yoga" },
  { id: "seva", label: "Seva" },
  { id: "chanting", label: "Chanting" },
  { id: "satsang", label: "Satsang" },
  { id: "fasting", label: "Fasting" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "journaling", label: "Journaling" },
  { id: "scripture", label: "Scripture Study" },
];

export const matches = [
  {
    id: "1", name: "Ananya", age: 27, location: "Rishikesh", photo: p1, compatibility: 94,
    guru: "Sadhguru", practice: "Hatha Yoga & Inner Engineering",
    bio: "Seeking a partner who walks the path of consciousness. Daily meditator, plant-based, lover of Vedic chants.",
    practices: ["Daily Yoga", "Vegetarian", "Chanting"],
  },
  {
    id: "2", name: "Arjun", age: 30, location: "Bangalore", photo: p2, compatibility: 89,
    guru: "Sri Sri Ravi Shankar", practice: "Sudarshan Kriya",
    bio: "Engineer by day, sadhak by dawn. Believe relationships are sacred ground for growth.",
    practices: ["Seva", "Yoga", "Satsang"],
  },
  {
    id: "3", name: "Meera", age: 26, location: "Pune", photo: p3, compatibility: 87,
    guru: "Osho", practice: "Dynamic Meditation",
    bio: "Artist, dancer, seeker. Looking for someone who values silence as much as celebration.",
    practices: ["Journaling", "Vegetarian", "Yoga"],
  },
  {
    id: "4", name: "Vikram", age: 32, location: "Varanasi", photo: p4, compatibility: 82,
    guru: "Ramana Maharshi", practice: "Self-Inquiry",
    bio: "On the path of Advaita. Seeking a companion in stillness and a friend in this lila.",
    practices: ["Scripture Study", "Silence", "Fasting"],
  },
];

export const posts = [
  { id: "1", author: "Ananya", avatar: p1, time: "2h", text: "Morning at the Ganga aarti. The river teaches what no book can. 🌊", likes: 124, comments: 18 },
  { id: "2", author: "Arjun", avatar: p2, time: "5h", text: "Completed 40 days of Sudarshan Kriya. The mind is finally a friend, not a battleground.", likes: 89, comments: 12 },
  { id: "3", author: "Meera", avatar: p3, time: "1d", text: "Dancing is my prayer. Movement is my mantra. Where do you find the divine?", likes: 201, comments: 34 },
];

export const events = [
  { id: "1", title: "Himalayan Silent Retreat", date: "Dec 15-22", location: "Dharamshala", attendees: 48, image: "retreat" },
  { id: "2", title: "Full Moon Satsang", date: "Nov 28", location: "Mumbai", attendees: 124, image: "satsang" },
  { id: "3", title: "Bhagavad Gita Study Circle", date: "Every Sunday", location: "Online", attendees: 312, image: "satsang" },
  { id: "4", title: "Kumbh Mela Pilgrimage", date: "Jan 2027", location: "Prayagraj", attendees: 1024, image: "retreat" },
];

export const chats = [
  { id: "1", name: "Ananya", avatar: p1, last: "That sounds beautiful 🙏", time: "10:24", unread: 2 },
  { id: "2", name: "Arjun", avatar: p2, last: "See you at the retreat!", time: "Yesterday", unread: 0 },
  { id: "3", name: "Meera", avatar: p3, last: "Sharing a poem with you...", time: "Mon", unread: 1 },
];
