export type GuruEntry = {
  id: string;
  name: string;
  tradition: string;
  lineage?: string;
  bio?: string;
  /** Optional portrait URL (HTTPS). Leave empty when not hosted. */
  imageUrl?: string | null;
};

export const gurus: GuruEntry[] = [
  {
    id: "sadhguru",
    name: "Sadhguru",
    tradition: "Isha Yoga",
    lineage: "Shiva tradition · classical yoga",
    bio: "Founder of Isha Foundation; emphasis on inner engineering and consecrated spaces.",
  },
  {
    id: "amma",
    name: "Mata Amritanandamayi",
    tradition: "Bhakti",
    lineage: "Sakti path · selfless love",
    bio: "Embracing the world through hugging and humanitarian seva.",
  },
  {
    id: "art-of-living",
    name: "Sri Sri Ravi Shankar",
    tradition: "Art of Living",
    lineage: "Vedantic insight · Sudarshan Kriya",
    bio: "Breath-based programs and satsang for peace in society.",
  },
  { id: "osho", name: "Osho", tradition: "Meditation", lineage: "Contemplative inquiry", bio: "Dynamic and silent meditation as doorways to awareness." },
  { id: "ramana", name: "Ramana Maharshi", tradition: "Advaita", lineage: "Self-inquiry", bio: "Who am I? as the direct path to the heart." },
  { id: "iskcon", name: "Srila Prabhupada", tradition: "ISKCON", lineage: "Gaudiya Vaishnava", bio: "Bhakti through nama and sacred service." },
  {
    id: "yogananda",
    name: "Paramahansa Yogananda",
    tradition: "Kriya Yoga",
    lineage: "Self-Realization Fellowship line",
    bio: "Kriya as scientific art of God-union.",
  },
  { id: "sai", name: "Sathya Sai Baba", tradition: "Universal Love", lineage: "Sathya Sai organizations", bio: "Love all, serve all; truth and right conduct." },
  {
    id: "bade-mandir-guruji",
    name: "Bade Mandir Guruji",
    tradition: "Bhakti · Guru bhakti",
    lineage: "Shri Ram Sharanam lineage (Bade Mandir)",
    bio: "Guidance rooted in naam, satsang, and humble seva at the feet of the Divine.",
  },
];

export const spiritualPaths = [
  { id: "bhakti", label: "Bhakti" },
  { id: "kriya", label: "Kriya" },
  { id: "advaita", label: "Advaita" },
  { id: "seva", label: "Seva-forward" },
  { id: "mindfulness", label: "Mindfulness" },
  { id: "tantra", label: "Tantra (classical)" },
  { id: "integral", label: "Integral yoga" },
];

export const sadhanaFrequencies = [
  { id: "daily_twice", label: "Twice daily" },
  { id: "daily_once", label: "Once daily" },
  { id: "most_days", label: "Most days" },
  { id: "weekly", label: "Weekly rhythm" },
  { id: "seasonal", label: "Seasonal intensives" },
];

export const spiritualValues = [
  { id: "ahimsa", label: "Ahimsa" },
  { id: "satya", label: "Satya" },
  { id: "brahmacharya", label: "Sacred discipline" },
  { id: "aparigraha", label: "Simplicity" },
  { id: "ishvara_pranidhana", label: "Surrender" },
  { id: "sangha", label: "Sangha" },
  { id: "silence", label: "Noble silence" },
];

export const programsUndergone = [
  { id: "vipassana_10", label: "10-day Vipassana" },
  { id: "isha_inner", label: "Isha Inner Engineering" },
  { id: "aol_part1", label: "Art of Living Part 1–2" },
  { id: "retreat_silent", label: "Silent retreat (7+ days)" },
  { id: "kriya_init", label: "Kriya initiation" },
  { id: "ytt", label: "Yoga teacher training" },
];

export const meditationExperiences = [
  { id: "beginner", label: "Beginning" },
  { id: "steady", label: "Steady (1–5 years)" },
  { id: "deep", label: "Deep (5+ years)" },
  { id: "monastic_touch", label: "Monastic periods" },
];

export const sevaInclinations = [
  { id: "daily_small", label: "Daily small acts" },
  { id: "weekly_sangha", label: "Weekly sangha seva" },
  { id: "retreat_cooking", label: "Retreat / kitchen seva" },
  { id: "teaching", label: "Teaching / mentoring" },
  { id: "quiet_support", label: "Quiet behind-the-scenes" },
];

export const marriageTimelines = [
  { id: "within_6m", label: "Within 6 months" },
  { id: "within_1y", label: "Within a year" },
  { id: "one_to_two_y", label: "1–2 years" },
  { id: "when_ready", label: "When the soul is ready" },
  { id: "friendship_first", label: "Friendship first" },
];

export const maritalStatuses = [
  { id: "never", label: "Never married" },
  { id: "divorced", label: "Divorced" },
  { id: "widowed", label: "Widowed" },
  { id: "separated", label: "Separated" },
];

export const childrenPreferences = [
  { id: "open", label: "Open" },
  { id: "yes", label: "Desire children" },
  { id: "no", label: "Prefer not" },
  { id: "discuss", label: "To be discerned together" },
];

export const relocationOptions = [
  { id: "flexible", label: "Open to relocate" },
  { id: "local", label: "Prefer to stay rooted" },
  { id: "short_stints", label: "Short stays only" },
];

export const familyOrientations = [
  { id: "joint", label: "Joint family friendly" },
  { id: "nuclear", label: "Nuclear preference" },
  { id: "flexible_fam", label: "Flexible" },
];

export const smokingHabits = [
  { id: "none", label: "None" },
  { id: "occasional", label: "Occasional" },
  { id: "regular", label: "Regular" },
];

export const drinkingHabits = [
  { id: "none", label: "None" },
  { id: "occasional", label: "Occasional" },
  { id: "social", label: "Social" },
];

export const languageOptions = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "kn", label: "Kannada" },
  { id: "ml", label: "Malayalam" },
  { id: "mr", label: "Marathi" },
  { id: "bn", label: "Bengali" },
  { id: "gu", label: "Gujarati" },
  { id: "sa", label: "Sanskrit" },
];

export const educationLevels = [
  { id: "school", label: "School" },
  { id: "ug", label: "Undergraduate" },
  { id: "pg", label: "Postgraduate" },
  { id: "doctorate", label: "Doctorate / research" },
  { id: "other_ed", label: "Other / self-taught" },
];

export const incomeRanges = [
  { id: "decline", label: "Prefer not to say" },
  { id: "under_5", label: "Under 5 LPA" },
  { id: "5_12", label: "5–12 LPA" },
  { id: "12_25", label: "12–25 LPA" },
  { id: "25_50", label: "25–50 LPA" },
  { id: "50_plus", label: "50+ LPA" },
];

export const religionOptions = [
  { id: "hindu", label: "Hindu" },
  { id: "buddhist", label: "Buddhist" },
  { id: "jain", label: "Jain" },
  { id: "sikh", label: "Sikh" },
  { id: "christian", label: "Christian" },
  { id: "muslim", label: "Muslim" },
  { id: "other_rel", label: "Other / plural" },
  { id: "spiritual_non", label: "Spiritual, non-labeled" },
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

export const dailyRhythmOptions = [
  { id: "early", label: "Early riser" },
  { id: "steady", label: "Steady rhythm" },
  { id: "flexible", label: "Flexible day" },
  { id: "quiet_evenings", label: "Quiet evenings" },
];

export const callPreferences = [
  { id: "whatsapp_text", label: "WhatsApp text first" },
  { id: "voice_ok", label: "Voice calls welcome" },
  { id: "either", label: "Either is fine" },
];

export const optionLabel = (options: { id: string; label: string }[], id: string | null | undefined) =>
  options.find((x) => x.id === id)?.label ?? "—";
