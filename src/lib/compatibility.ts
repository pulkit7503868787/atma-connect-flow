import { calculateAISpiritualCompatibility, computeFinalCompatibilityScore } from "@/lib/aiMatching";
import { gurus } from "@/lib/onboardingOptions";

export type CompatibilityResult = {
  score: number;
  reasons: string[];
};

/** Duck-typed profile slice for scoring (maps from UserProfile rows). */
export type CompatibilityInput = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v)).trim();

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);

const overlapCount = (a: string[], b: string[]) => {
  const bb = new Set(b);
  if (!a.length || !bb.size) {
    return 0;
  }
  return a.filter((x) => bb.has(x)).length;
};

const traditionForGuru = (guruId: string) => {
  if (!guruId) {
    return null;
  }
  return gurus.find((g) => g.id === guruId)?.tradition ?? null;
};

/**
 * Weighted spiritual compatibility (0–100) + short sacred explanations.
 * Pairs with the semantic AI layer in `aiMatching.ts` via `computeFinalCompatibilityScore`.
 */
export const computeStructuredCompatibility = (me: CompatibilityInput, other: CompatibilityInput): CompatibilityResult => {
  let raw = 0;
  const reasons: string[] = [];

  const pushReason = (label: string, pts: number) => {
    if (pts <= 0) {
      return;
    }
    raw += pts;
    if (reasons.length < 6) {
      reasons.push(label);
    }
  };

  const gMe = str(me.guru);
  const gO = str(other.guru);
  if (gMe && gMe === gO) {
    pushReason("Shared Guru lineage", 22);
  } else {
    const mt = traditionForGuru(gMe);
    const ot = traditionForGuru(gO);
    if (mt && ot && mt === ot) {
      pushReason("Kindred tradition", 10);
    }
  }

  const practiceOverlap = overlapCount(arr(me.practices), arr(other.practices));
  if (practiceOverlap > 0) {
    const pts = Math.min(18, practiceOverlap * 5);
    pushReason(practiceOverlap > 1 ? "Harmonized daily practices" : "A shared practice on the path", pts);
  }

  const spMe = str(me.spiritual_path);
  if (spMe && spMe === str(other.spiritual_path)) {
    pushReason("Aligned spiritual path", 14);
  }

  const sfMe = str(me.sadhana_frequency);
  if (sfMe && sfMe === str(other.sadhana_frequency)) {
    pushReason("Similar rhythm of sadhana", 10);
  }

  const progOverlap = overlapCount(arr(me.programs_undergone), arr(other.programs_undergone));
  if (progOverlap > 0) {
    pushReason("Parallel retreats or immersions", Math.min(8, progOverlap * 3));
  }

  const valOverlap = overlapCount(arr(me.spiritual_values), arr(other.spiritual_values));
  if (valOverlap > 0) {
    pushReason("Resonant spiritual values", Math.min(12, valOverlap * 4));
  }

  if (str(me.meditation_experience) && str(me.meditation_experience) === str(other.meditation_experience)) {
    pushReason("Similar depth in meditation", 8);
  }

  if (str(me.seva_inclination) && str(me.seva_inclination) === str(other.seva_inclination)) {
    pushReason("Matched seva inclination", 6);
  }

  if (str(me.marriage_timeline) && str(me.marriage_timeline) === str(other.marriage_timeline)) {
    pushReason("Similar marriage intentions", 8);
  }

  if (str(me.family_orientation) && str(me.family_orientation) === str(other.family_orientation)) {
    pushReason("Aligned family orientation", 5);
  }

  if (str(me.relocation_openness) && str(me.relocation_openness) === str(other.relocation_openness)) {
    pushReason("Comparable openness to relocation", 5);
  }

  if (str(me.diet) && str(me.diet) === str(other.diet)) {
    pushReason("Harmonious diet", 6);
  }

  if (str(me.lifestyle) && str(me.lifestyle) === str(other.lifestyle)) {
    pushReason("Lifestyle in step", 5);
  }

  const langOverlap = overlapCount(arr(me.languages), arr(other.languages));
  if (langOverlap > 0) {
    pushReason("Shared languages of the heart", Math.min(5, langOverlap * 2));
  }

  if (str(me.smoking_habit) && str(me.smoking_habit) === str(other.smoking_habit)) {
    pushReason("Aligned on smoking", 3);
  }

  if (str(me.drinking_habit) && str(me.drinking_habit) === str(other.drinking_habit)) {
    pushReason("Aligned on drinking", 3);
  }

  if (str(me.occupation) && str(me.occupation) === str(other.occupation)) {
    pushReason("Similar worldly work", 3);
  }

  if (str(me.education) && str(me.education) === str(other.education)) {
    pushReason("Comparable education", 2);
  }

  if (str(me.income_range) && str(me.income_range) === str(other.income_range)) {
    pushReason("Similar income range", 2);
  }

  const hMe = me.height_cm;
  const hO = other.height_cm;
  if (typeof hMe === "number" && typeof hO === "number" && Number.isFinite(hMe) && Number.isFinite(hO)) {
    const d = Math.abs(hMe - hO);
    if (d <= 8) {
      pushReason("Comfortable height harmony", 2);
    }
  }

  if (str(me.religion) && str(me.religion) === str(other.religion)) {
    pushReason("Shared religion", 2);
  }

  if (str(me.nakshatra) && str(me.nakshatra) === str(other.nakshatra)) {
    pushReason("Same nakshatra", 1);
  }

  if (str(me.caste) && str(me.caste) === str(other.caste)) {
    pushReason("Same caste background", 1);
  }

  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { score, reasons };
};

export const computeBlendedCompatibilityScore = (me: CompatibilityInput, other: CompatibilityInput): number => {
  const structured = computeStructuredCompatibility(me, other);
  const ai = calculateAISpiritualCompatibility(
    { bio: str(me.bio) || null, guru: str(me.guru) || null, practices: arr(me.practices) },
    { bio: str(other.bio) || null, guru: str(other.guru) || null, practices: arr(other.practices) }
  );
  return computeFinalCompatibilityScore(structured.score, ai.aiScore);
};

export const computeBlendedWithReasons = (me: CompatibilityInput, other: CompatibilityInput): CompatibilityResult => {
  const structured = computeStructuredCompatibility(me, other);
  const ai = calculateAISpiritualCompatibility(
    { bio: str(me.bio) || null, guru: str(me.guru) || null, practices: arr(me.practices) },
    { bio: str(other.bio) || null, guru: str(other.guru) || null, practices: arr(other.practices) }
  );
  const score = computeFinalCompatibilityScore(structured.score, ai.aiScore);
  const reasons = [...structured.reasons, ...ai.reasons].slice(0, 6);
  return { score, reasons };
};
