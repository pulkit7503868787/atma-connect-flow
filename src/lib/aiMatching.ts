/**
 * Lightweight, deterministic “spiritual compatibility” layer (no external APIs).
 * Combines bio/practice text overlap with themed keyword clusters.
 */

export type SpiritualSignals = {
  bio: string | null | undefined;
  guru: string | null | undefined;
  practices: readonly string[] | string[] | null | undefined;
};

export type AISpiritualCompatibilityResult = {
  /** 0–100 combined semantic + values score (not blended with guru/practices matrix yet). */
  aiScore: number;
  /** Short human-readable highlights (max 3). */
  reasons: string[];
};

type Cluster = {
  reason: string;
  keywords: readonly string[];
  weight: number;
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "me",
  "him",
  "us",
  "them",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "here",
  "there",
  "then",
  "am",
  "im",
  "ive",
  "dont",
]);

const CLUSTERS: Cluster[] = [
  {
    reason: "Shared meditation practices",
    keywords: ["meditation", "mindfulness", "vipassana", "dhyana", "zen", "silent"],
    weight: 14,
  },
  {
    reason: "Aligned seva and service path",
    keywords: ["seva", "service", "karma", "volunteer", "giving"],
    weight: 14,
  },
  {
    reason: "Similar devotion and bhakti",
    keywords: ["bhakti", "devotion", "prayer", "mantra", "kirtan", "chanting"],
    weight: 14,
  },
  {
    reason: "Shared healing and inner-work focus",
    keywords: ["healing", "therapy", "wellness", "inner", "shadow"],
    weight: 12,
  },
  {
    reason: "Similar inner-growth focus",
    keywords: ["sadhana", "awakening", "growth", "path", "liberation", "realization"],
    weight: 12,
  },
  {
    reason: "Aligned spiritual path",
    keywords: ["guru", "disciple", "ashram", "temple", "satsang"],
    weight: 10,
  },
];

const normalizeWords = (text: string): Set<string> => {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  const out = new Set<string>();
  for (const w of raw) {
    if (w.length < 2 || STOPWORDS.has(w)) {
      continue;
    }
    out.add(w);
  }
  return out;
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) {
      inter++;
    }
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
};

const buildCombinedText = (s: SpiritualSignals): string => {
  const bio = (s.bio ?? "").trim();
  const guru = (s.guru ?? "").trim();
  const pr = Array.isArray(s.practices) ? s.practices.join(" ") : "";
  return `${bio} ${guru} ${pr}`.toLowerCase();
};

/**
 * Blends legacy guru/practices matrix score with the AI layer (55% / 45%).
 */
export const computeFinalCompatibilityScore = (existingScore: number, aiScore: number): number => {
  const base = Number.isFinite(existingScore) ? existingScore : 0;
  const ai = Number.isFinite(aiScore) ? aiScore : 0;
  return Math.min(100, Math.max(0, Math.round(base * 0.55 + ai * 0.45)));
};

export const calculateAISpiritualCompatibility = (
  userA: SpiritualSignals,
  userB: SpiritualSignals
): AISpiritualCompatibilityResult => {
  const textA = buildCombinedText(userA);
  const textB = buildCombinedText(userB);

  if (!textA.trim() && !textB.trim()) {
    return { aiScore: 40, reasons: [] };
  }

  const practicesA = Array.isArray(userA.practices) ? userA.practices : [];
  const practicesB = Array.isArray(userB.practices) ? userB.practices : [];

  const wordsFullA = normalizeWords(`${userA.bio ?? ""} ${userA.guru ?? ""} ${practicesA.join(" ")}`);
  const wordsFullB = normalizeWords(`${userB.bio ?? ""} ${userB.guru ?? ""} ${practicesB.join(" ")}`);

  const bioA = (userA.bio ?? "").trim();
  const bioB = (userB.bio ?? "").trim();

  let bioSemanticPoints = 0;
  if (bioA.length > 0 && bioB.length > 0) {
    bioSemanticPoints = Math.round(50 * jaccard(normalizeWords(bioA), normalizeWords(bioB)));
  } else {
    bioSemanticPoints = Math.round(42 * jaccard(wordsFullA, wordsFullB));
  }

  let clusterPoints = 0;
  const reasons: string[] = [];

  for (const cluster of CLUSTERS) {
    const hitA = cluster.keywords.some((k) => textA.includes(k));
    const hitB = cluster.keywords.some((k) => textB.includes(k));
    if (hitA && hitB) {
      clusterPoints += cluster.weight;
      reasons.push(cluster.reason);
    }
  }

  clusterPoints = Math.min(50, clusterPoints);

  const aiScore = Math.min(100, Math.max(0, bioSemanticPoints + clusterPoints));

  return {
    aiScore,
    reasons: reasons.slice(0, 3),
  };
};
