export type GuruEntry = {
  id: string;
  name: string;
  tradition: string;
  lineage?: string;
  bio?: string;
  /** Local portrait under /public/gurus */
  imagePath?: string | null;
  shortLabel?: string;
};

export const OTHER_WRITE_ID = "other_write";
export const OTHER_WRITE_CORE_ID = "other_write_core";
export const OTHER_WRITE_TRADITIONS_ID = "other_write_traditions";

export const isOtherWriteOptionId = (id: string) => id.startsWith("other_write");

export const getGuruPortraitSrc = (g: GuruEntry): string | null => g.imagePath?.trim() || null;

/** Legacy guru ids still resolve for existing profiles */
const legacyGuruAliases: Record<string, string> = {
  sadhguru: "sadhguru",
  "art-of-living": "sri-sri",
  sai: "sai-baba",
  amma: "other",
  ramana: "other",
  iskcon: "iskcon",
};

export const resolveGuruId = (id: string | null | undefined): string => {
  const t = id?.trim();
  if (!t) return "";
  return legacyGuruAliases[t] ?? t;
};

export const gurus: GuruEntry[] = [
  {
    id: "neem-karoli",
    name: "Neem Karoli Baba",
    shortLabel: "Neem Karoli",
    tradition: "Bhakti · Hanuman",
    lineage: "Ram Dass lineage",
    bio: "Unconditional love and simple remembrance of the Divine.",
    imagePath: "/gurus/neem-karoli.jpg",
  },
  {
    id: "bade-mandir-guruji",
    name: "Bade Mandir Guruji",
    shortLabel: "Bade Mandir",
    tradition: "Bhakti · Guru bhakti",
    lineage: "Shri Ram Sharanam",
    bio: "Naam, satsang, and humble seva at the feet of the Divine.",
    imagePath: "/gurus/bade-mandir-guruji.jpg",
  },
  {
    id: "osho",
    name: "Osho",
    tradition: "Meditation",
    lineage: "Contemplative inquiry",
    bio: "Dynamic and silent meditation as doorways to awareness.",
    imagePath: "/gurus/osho.jpg",
  },
  {
    id: "krishna",
    name: "Krishna",
    tradition: "Bhakti",
    lineage: "Lila · divine play",
    bio: "Devotion through naam, leela, and surrender.",
    imagePath: "/gurus/krishna.jpg",
  },
  {
    id: "sadhguru",
    name: "Sadhguru",
    tradition: "Isha Yoga",
    lineage: "Classical yoga · inner engineering",
    bio: "Consecrated spaces and disciplined inner work.",
    imagePath: "/gurus/sadguru.jpg",
  },
  {
    id: "yogananda",
    name: "Paramahansa Yogananda",
    shortLabel: "Yogananda",
    tradition: "Kriya Yoga",
    lineage: "Self-Realization Fellowship",
    bio: "Kriya as the scientific art of God-union.",
    imagePath: "/gurus/yogananda.jpg",
  },
  {
    id: "sri-sri",
    name: "Sri Sri Ravi Shankar",
    shortLabel: "Sri Sri",
    tradition: "Art of Living",
    lineage: "Sudarshan Kriya",
    bio: "Breath, satsang, and peace in society.",
    imagePath: "/gurus/ravishankar.jpg",
  },
  {
    id: "premanand",
    name: "Premanand Ji Maharaj",
    shortLabel: "Premanand",
    tradition: "Bhakti",
    lineage: "Krishna bhakti",
    bio: "Satsang and heart-centered devotion.",
    imagePath: "/gurus/premanand.jpg",
  },
  {
    id: "sai-baba",
    name: "Sai Baba",
    tradition: "Universal love",
    lineage: "Sathya Sai tradition",
    bio: "Love all, serve all; truth and right conduct.",
    imagePath: "/gurus/saibaba.jpg",
  },
  {
    id: "radhasoami",
    name: "Radha Soami",
    shortLabel: "Radha Soami",
    tradition: "Sant Mat",
    lineage: "Surat Shabd Yoga",
    bio: "Inner sound and light with ethical living.",
    imagePath: "/gurus/radha-soami.jpg",
  },
  {
    id: "guru-nanak",
    name: "Guru Nanak",
    shortLabel: "Guru Nanak",
    tradition: "Sikh · Gurbani",
    lineage: "Naam simran · seva",
    bio: "Remembrance of the One through naam and humble service.",
    imagePath: "/gurus/guru-nanak.jpg",
  },
  {
    id: "buddha",
    name: "Buddha",
    shortLabel: "Buddha",
    tradition: "Buddhist path",
    lineage: "Mindfulness · compassion",
    bio: "Awakening through mindful presence and loving-kindness.",
    imagePath: "/gurus/buddha.jpg",
  },
  {
    id: "other",
    name: "Other",
    shortLabel: "Other",
    tradition: "Your lineage",
    bio: "A guide or path not listed — honour it in your own words.",
  },
];

export type PathOption = { id: string; label: string };

export type SpiritualPathGroup = { group: string; options: PathOption[] };

export const spiritualPathGroups: SpiritualPathGroup[] = [
  {
    group: "Core paths",
    options: [
      { id: "bhakti", label: "Bhakti" },
      { id: "kriya", label: "Kriya" },
      { id: "advaita", label: "Advaita" },
      { id: "seva", label: "Seva-forward" },
      { id: "mindfulness", label: "Mindfulness" },
      { id: "tantra", label: "Tantra (classical)" },
      { id: "integral", label: "Integral yoga" },
      { id: OTHER_WRITE_CORE_ID, label: "Other" },
    ],
  },
  {
    group: "Traditions & affiliations",
    options: [
      { id: "advaita_vedanta", label: "Advaita Vedanta (Self-Enquiry)" },
      { id: "arhatic", label: "Arhatic Yoga / Pranic Healing" },
      { id: "art_of_living", label: "Art of Living" },
      { id: "ashtanga", label: "Ashtanga Yoga" },
      { id: "baps", label: "BAPS" },
      { id: "buddhism", label: "Buddhism" },
      { id: "djjs", label: "DJJS" },
      { id: "ekam", label: "Ekam / Oneness" },
      { id: "isha_meditator", label: "Isha Meditator" },
      { id: "iskcon", label: "ISKCON" },
      { id: "iyengar", label: "Iyengar Yoga" },
      { id: "oshoite", label: "Oshoite" },
      { id: "premanand_follower", label: "Premanand Ji Maharaj Follower" },
      { id: "radhasoami_path", label: "Radha Soami" },
      { id: "raja_yoga", label: "Raja Yoga / Brahma Kumaris" },
      { id: "sahaja", label: "Sahaja Yoga" },
      { id: "samarpan", label: "Samarpan Meditation" },
      { id: "srf", label: "Self-Realization Fellowship" },
      { id: "shiv_yog", label: "Shiv Yog" },
      { id: "sky_yoga", label: "SKY Yoga" },
      { id: "sufism", label: "Sufism" },
      { id: "tm", label: "TM" },
      { id: "vipassana_path", label: "Vipassana" },
      { id: "yoga_teacher", label: "Yoga Teacher" },
      { id: OTHER_WRITE_TRADITIONS_ID, label: "Other" },
    ],
  },
];

/** Flat list for selects and lookups (includes legacy core paths once). */
export const spiritualPaths: PathOption[] = spiritualPathGroups.flatMap((g) => g.options);

export const parseSpiritualPathIds = (raw: string | null | undefined): string[] => {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
};

export const serializeSpiritualPathIds = (ids: string[]): string => [...new Set(ids.filter(Boolean))].join(",");

export const formatSpiritualPathsDisplay = (raw: string | null | undefined): string => {
  const ids = parseSpiritualPathIds(raw);
  if (!ids.length) return "";
  return ids.map((id) => spiritualPathLabelFromId(id)).join(" · ");
};

export const ageOptions = Array.from({ length: 63 }, (_, i) => {
  const age = i + 18;
  return { value: String(age), label: String(age) };
});

export const nakshatraOptions = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
].map((n) => ({ id: n.toLowerCase().replace(/\s+/g, "_"), label: n }));

export const occupationOptions = [
  { id: "student", label: "Student" },
  { id: "professional", label: "Professional / corporate" },
  { id: "entrepreneur", label: "Entrepreneur" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "creative", label: "Creative / arts" },
  { id: "wellness", label: "Wellness / yoga teacher" },
  { id: "homemaker", label: "Homemaker" },
  { id: "retired", label: "Retired" },
  { id: "spiritual_worker", label: "Spiritual / seva full-time" },
  { id: OTHER_WRITE_ID, label: "Other" },
];

export const customListId = (text: string) => `custom:${text.trim()}`;

export const labelForListId = (options: { id: string; label: string }[], id: string) => {
  if (id.startsWith("custom:")) return id.slice(7);
  return options.find((o) => o.id === id)?.label ?? id;
};

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
  { id: "brahmacharya", label: "Brahmacharya (conscious restraint)" },
  { id: "aparigraha", label: "Simplicity" },
  { id: "ishvara_pranidhana", label: "Surrender" },
  { id: "sangha", label: "Sangha" },
  { id: "silence", label: "Noble silence" },
  { id: OTHER_WRITE_ID, label: "Other" },
];

export const programsUndergone = [
  { id: "vipassana_10", label: "10-day Vipassana" },
  { id: "isha_inner", label: "Isha Inner Engineering" },
  { id: "aol_part1", label: "Art of Living Part 1–2" },
  { id: "retreat_silent", label: "Silent retreat (7+ days)" },
  { id: "kriya_init", label: "Kriya initiation" },
  { id: "ytt", label: "Yoga teacher training" },
  { id: OTHER_WRITE_ID, label: "Other" },
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
  { id: "never", label: "Not yet married" },
  { id: "divorced", label: "Previously married · divorced" },
  { id: "widowed", label: "Widowed · open to companionship" },
  { id: "separated", label: "Separated · discerning next chapter" },
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
  { id: OTHER_WRITE_ID, label: "Other" },
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
  { id: "dhyan", label: "Dhyan", icon: "🕉️" },
  { id: "meditation_tantra", label: "Tantra", icon: "🔥" },
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
  { id: OTHER_WRITE_ID, label: "Other" },
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

export const SELECT_PLACEHOLDER = "Choose…";
export const SELECT_SOFT_DEFAULT = "Not specified";

export const optionLabel = (options: { id: string; label: string }[], id: string | null | undefined) =>
  options.find((x) => x.id === id)?.label ?? "";

export const heightOptions = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let ft = 4; ft <= 7; ft += 1) {
    for (let inch = 0; inch < 12; inch += 1) {
      const cm = Math.round((ft * 12 + inch) * 2.54);
      if (cm < 140 || cm > 210) continue;
      opts.push({ value: String(cm), label: `${ft}'${inch}"` });
    }
  }
  return opts;
})();

export const listIdsForUi = (ids: string[]) => {
  const hasCustom = ids.some((id) => id.startsWith("custom:"));
  const base = ids.filter((id) => !id.startsWith("custom:"));
  return hasCustom ? [...base, OTHER_WRITE_ID] : base;
};

export const extractCustomFromList = (ids: string[]) => {
  const custom = ids.find((id) => id.startsWith("custom:"));
  return custom ? custom.slice(7) : "";
};

export const commitCustomToList = (ids: string[], customText: string) => {
  const base = ids.filter((id) => id !== OTHER_WRITE_ID && !id.startsWith("custom:"));
  const t = customText.trim();
  if (ids.includes(OTHER_WRITE_ID) && t) return [...base, customListId(t)];
  return base;
};

export const guruDisplayName = (guruId: string | null | undefined, notes?: string | null) => {
  const id = resolveGuruId(guruId);
  if (!id) return "";
  if (id === "other" && notes?.trim()) return notes.trim();
  return gurus.find((g) => g.id === id)?.name ?? guruId ?? "—";
};

export const occupationLabel = (raw: string | null | undefined) => {
  if (!raw?.trim()) return "";
  if (raw.startsWith("custom:")) return raw.slice(7);
  return occupationOptions.find((o) => o.id === raw)?.label ?? raw;
};

const spiritualPathLabelFromId = (id: string) => {
  if (id.startsWith("custom:core:")) return id.slice(12);
  if (id.startsWith("custom:traditions:")) return id.slice(18);
  if (id.startsWith("custom:")) return id.slice(7);
  return spiritualPaths.find((p) => p.id === id)?.label ?? id;
};

/** @deprecated Use serializeSpiritualPathWithOthers */
export const serializeSpiritualPathWithOther = (ids: string[], otherText: string) =>
  serializeSpiritualPathWithOthers(ids, { [OTHER_WRITE_CORE_ID]: otherText });

export const serializeSpiritualPathWithOthers = (
  ids: string[],
  otherTexts: Partial<Record<string, string>>
) => {
  const base = ids.filter((id) => !isOtherWriteOptionId(id) && !id.startsWith("custom:"));
  const out = [...base];
  const coreText = otherTexts[OTHER_WRITE_CORE_ID]?.trim();
  const tradText = otherTexts[OTHER_WRITE_TRADITIONS_ID]?.trim();
  if (ids.includes(OTHER_WRITE_CORE_ID) && coreText) {
    out.push(`custom:core:${coreText}`);
  }
  if (ids.includes(OTHER_WRITE_TRADITIONS_ID) && tradText) {
    out.push(`custom:traditions:${tradText}`);
  }
  return serializeSpiritualPathIds(out);
};

export const parseSpiritualPathForUi = (raw: string | null | undefined) => {
  const ids = parseSpiritualPathIds(raw);
  const base = ids.filter((id) => !id.startsWith("custom:"));
  let coreText = "";
  let traditionsText = "";
  for (const id of ids) {
    if (id.startsWith("custom:core:")) coreText = id.slice(12);
    else if (id.startsWith("custom:traditions:")) traditionsText = id.slice(18);
    else if (id.startsWith("custom:") && !coreText) coreText = id.slice(7);
  }
  const uiIds = [...base];
  if (coreText) uiIds.push(OTHER_WRITE_CORE_ID);
  if (traditionsText) uiIds.push(OTHER_WRITE_TRADITIONS_ID);
  return { ids: uiIds, coreText, traditionsText };
};
