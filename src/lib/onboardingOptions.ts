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

export const dietOptions = [
  { id: "sattvic", label: "Sattvic" },
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "lacto_vegetarian", label: "Lacto-vegetarian" },
  { id: "flexitarian", label: "Flexitarian" },
];

export const lifestyleOptions = [
  { id: "ashram_stay", label: "Ashram-stay" },
  { id: "householder", label: "Householder" },
  { id: "vanaprastha", label: "Vanaprastha" },
  { id: "traveling_seeker", label: "Traveling seeker" },
];

export const optionLabel = (options: { id: string; label: string }[], id: string | null | undefined) =>
  options.find((x) => x.id === id)?.label ?? "—";
