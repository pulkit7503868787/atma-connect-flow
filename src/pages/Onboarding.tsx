import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SpiritualEssencePicker } from "@/components/profile/SpiritualEssencePicker";
import { ChipMultiSelect } from "@/components/profile/ChipMultiSelect";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import {
  ageOptions,
  commitCustomToList,
  extractCustomFromList,
  gurus,
  listIdsForUi,
  marriageTimelines,
  meditationTypes,
  optionLabel,
  practices,
  resolveGuruId,
  sadhanaFrequencies,
  serializeSpiritualPathWithOther,
  spiritualPathGroups,
  formatSpiritualPathsDisplay,
  parseSpiritualPathForUi,
} from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";
import { updateUserProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/db";

const TOTAL = 5;

const deriveSpiritualPath = (medIds: string[]): string | null => {
  if (medIds.includes("kriya")) return "kriya";
  if (medIds.includes("bhakti")) return "bhakti";
  if (medIds.includes("mindfulness") || medIds.includes("vipassana")) return "mindfulness";
  if (medIds.includes("mantra")) return "bhakti";
  if (medIds.includes("silence")) return "advaita";
  if (medIds.includes("dhyan")) return "advaita";
  if (medIds.includes("meditation_tantra")) return "tantra";
  return medIds.length ? "integral" : null;
};

const deriveMeditationExperience = (medIds: string[]): string | null => {
  if (medIds.length >= 5) return "deep";
  if (medIds.length >= 3) return "steady";
  if (medIds.length >= 1) return "beginner";
  return null;
};

const deriveSadhanaFromPractices = (pracIds: string[]): string => {
  if (pracIds.length >= 5) return "daily_twice";
  if (pracIds.length >= 2) return "daily_once";
  return "most_days";
};

const Onboarding = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("28");
  const [intent, setIntent] = useState<string>("");
  const [guru, setGuru] = useState<string>("");
  const [guruOtherName, setGuruOtherName] = useState("");
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [pathOther, setPathOther] = useState("");
  const [med, setMed] = useState<string[]>([]);
  const [prac, setPrac] = useState<string[]>([]);
  const [pracOther, setPracOther] = useState("");
  const [optionalMarriage, setOptionalMarriage] = useState("");
  const [optionalSadhana, setOptionalSadhana] = useState("");
  const [optionalRefineOpen, setOptionalRefineOpen] = useState(false);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const previewPath =
    pathIds.length > 0
      ? formatSpiritualPathsDisplay(serializeSpiritualPathWithOther(pathIds, pathOther))
      : formatSpiritualPathsDisplay(deriveSpiritualPath(med) ?? "integral");

  useEffect(() => {
    let mounted = true;

    const guardCompletedProfile = async () => {
      const profile = await getCurrentUserProfile();
      if (mounted && isProfileComplete(profile)) {
        nav("/app", { replace: true });
      }
      if (mounted && profile && !isProfileComplete(profile)) {
        if (profile.full_name?.trim()) setName(profile.full_name.trim());
        if (profile.guru?.trim()) {
          setGuru(resolveGuruId(profile.guru.trim()));
          if (profile.guru_notes?.trim()) setGuruOtherName(profile.guru_notes.trim());
        }
        if (profile.practices?.length) {
          setPrac(listIdsForUi(profile.practices));
          setPracOther(extractCustomFromList(profile.practices));
        }
        const parsed = parseSpiritualPathForUi(profile.spiritual_path);
        if (parsed.ids.length) {
          setPathIds(parsed.ids);
          setPathOther(parsed.otherText);
        }
        if (profile.age != null) setAge(String(profile.age));
        if (profile.marriage_timeline?.trim()) setOptionalMarriage(profile.marriage_timeline.trim());
        if (profile.sadhana_frequency?.trim()) setOptionalSadhana(profile.sadhana_frequency.trim());
      }
    };

    void guardCompletedProfile();
    return () => {
      mounted = false;
    };
  }, [nav]);

  const next = async () => {
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      toast.error("Please sign in to continue.");
      nav("/auth");
      return;
    }

    const existingProfile = await getCurrentUserProfile();
    let derivedGender = existingProfile?.gender?.trim() || "unspecified";
    if (intent === "Bride") derivedGender = "male";
    else if (intent === "Groom") derivedGender = "female";
    const derivedSeekingGender =
      intent === "Bride" ? "female" : intent === "Groom" ? "male" : existingProfile?.seeking_gender?.trim() || "any";
    const parsedAge = Number.parseInt(age, 10);
    const derivedAge =
      Number.isFinite(parsedAge) && parsedAge >= 18 && parsedAge <= 80
        ? parsedAge
        : (existingProfile?.age ?? 28);
    const derivedCity = existingProfile?.city?.trim() || "Unknown";
    const derivedBio =
      existingProfile?.bio?.trim() || "On a spiritual journey seeking a conscious connection.";
    const derivedGuru = guru || existingProfile?.guru || "";
    if (!derivedGuru) {
      setSubmitting(false);
      toast.error("Please choose a guide in Spiritual Essence before entering.");
      setStep(1);
      return;
    }
    const selectedPractices = commitCustomToList(prac, pracOther);
    const finalPractices = selectedPractices.length > 0 ? selectedPractices : ["yoga"];
    const spiritualPath =
      pathIds.length > 0
        ? serializeSpiritualPathWithOther(pathIds, pathOther)
        : deriveSpiritualPath(med) ?? existingProfile?.spiritual_path ?? "integral";
    const sadhanaFrequency = optionalSadhana.trim() || deriveSadhanaFromPractices(finalPractices);
    const marriageTimeline = optionalMarriage.trim() || "when_ready";
    const guruNotes =
      guru === "other"
        ? guruOtherName.trim() || existingProfile?.guru_notes?.trim() || null
        : existingProfile?.guru_notes?.trim() || null;

    const result = await updateUserProfile(user.id, {
      full_name: name.trim() || null,
      gender: derivedGender,
      seeking_gender: derivedSeekingGender,
      age: derivedAge,
      city: derivedCity,
      bio: derivedBio,
      guru: derivedGuru || null,
      guru_notes: guruNotes,
      practices: finalPractices,
      spiritual_path: spiritualPath,
      sadhana_frequency: sadhanaFrequency,
      marriage_timeline: marriageTimeline,
      meditation_experience: deriveMeditationExperience(med),
      seva_inclination: finalPractices.includes("seva") ? "daily_small" : null,
      programs_undergone: existingProfile?.programs_undergone?.length ? existingProfile.programs_undergone : [],
      spiritual_values: existingProfile?.spiritual_values?.length ? existingProfile.spiritual_values : [],
      onboarding_completed: true,
    });

    if (!result.ok) {
      setSubmitting(false);
      toast.error(result.error ?? "Could not save your profile.");
      return;
    }

    nav("/app", { replace: true });
  };

  const back = () => (step > 0 ? setStep(step - 1) : nav(-1));

  return (
    <div className="min-h-screen bg-gradient-dawn flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={back} className="h-9 w-9 rounded-full bg-card/80 backdrop-blur grid place-items-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all", i <= step ? "w-8 bg-primary" : "w-4 bg-border")} />
          ))}
        </div>
        <button onClick={() => nav("/app")} className="text-xs text-muted-foreground hover:text-foreground">
          Skip
        </button>
      </header>

      <main className="flex-1 px-6 max-w-md mx-auto w-full pb-24 overflow-y-auto">
        {step === 0 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 1 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">What shall we call you?</h2>
            <p className="text-muted-foreground mt-2">Your name carries a vibration. Share it with us.</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya"
              className="h-14 mt-8 bg-card border-border/60 text-lg"
            />
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium">Your age</p>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full h-12 rounded-xl border border-border/60 bg-card px-3 text-sm"
              >
                {ageOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">I am seeking</p>
              <div className="grid grid-cols-3 gap-2">
                {["Bride", "Groom", "Friend"].map((o) => (
                  <button
                    key={o}
                    onClick={() => setIntent(o)}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-medium transition-all",
                      intent === o
                        ? "bg-primary text-primary-foreground border-primary shadow-warm"
                        : "bg-card border-border/60 hover:border-primary/40"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 2 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">Spiritual Essence</h2>
            <p className="text-muted-foreground mt-2">The guide whose presence resonates with your heart.</p>
            <SpiritualEssencePicker
              className="mt-6"
              gurus={gurus}
              value={guru}
              onChange={setGuru}
              otherName={guruOtherName}
              onOtherNameChange={setGuruOtherName}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 3 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">How do you meditate?</h2>
            <p className="text-muted-foreground mt-2">Select all that resonate.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6">
              {meditationTypes.map((m) => {
                const sel = med.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(med, setMed, m.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-left transition-all",
                      sel ? "bg-primary/10 border-primary shadow-warm" : "bg-card border-border/60 hover:border-primary/40"
                    )}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-sm font-medium leading-tight">{m.label}</div>
                    {sel && <Check className="h-3.5 w-3.5 text-primary mt-1.5" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 space-y-2">
              <p className="text-sm font-medium">Spiritual path & affiliations</p>
              <p className="text-xs text-muted-foreground">Choose all that shape your journey.</p>
              <ChipMultiSelect
                groups={spiritualPathGroups}
                value={pathIds}
                onChange={setPathIds}
                otherText={pathOther}
                onOtherTextChange={setPathOther}
                otherPlaceholder="Your path or affiliation"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 4 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">Your daily practices</h2>
            <p className="text-muted-foreground mt-2">What grounds your every day?</p>
            <ChipMultiSelect
              className="mt-6"
              options={practices}
              value={prac}
              onChange={setPrac}
              otherText={pracOther}
              onOtherTextChange={setPracOther}
              otherPlaceholder="A practice you hold dear"
            />
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in pt-8 text-center">
            <div className="h-24 w-24 mx-auto rounded-full bg-gradient-saffron grid place-items-center shadow-warm animate-breathe">
              <span className="text-4xl">🪷</span>
            </div>
            <h2 className="font-serif text-4xl mt-6">Welcome, {name || "seeker"}</h2>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
              Your profile is ready. May this journey lead you toward a soul that mirrors your own.
            </p>
            <div className="glass-card rounded-2xl p-5 mt-8 text-left space-y-2">
              {guru && <Row label="Guru" value={gurus.find((g) => g.id === guru)?.name || guruOtherName || ""} />}
              <Row label="Path" value={previewPath} />
              <Row label="Meditation" value={`${med.length} selected`} />
              <Row label="Practices" value={`${prac.length} selected`} />
              <Row label="Seeking" value={intent || "—"} />
              <Row label="Age" value={age} />
              <Row
                label="Marriage intention"
                value={optionalMarriage ? optionLabel(marriageTimelines, optionalMarriage) : "When the soul is ready (default)"}
              />
              <Row
                label="Sadhana rhythm"
                value={optionalSadhana ? optionLabel(sadhanaFrequencies, optionalSadhana) : "Gentle default from your practices"}
              />
            </div>

            <Collapsible open={optionalRefineOpen} onOpenChange={setOptionalRefineOpen} className="mt-6 text-left">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>Refine intention & rhythm</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", optionalRefineOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-5 pt-4 px-0.5">
                <p className="text-xs text-muted-foreground">You can always deepen this later in your profile.</p>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Marriage timeline</p>
                  <div className="flex flex-wrap gap-2">
                    {marriageTimelines.map((m) => {
                      const sel = optionalMarriage === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setOptionalMarriage(sel ? "" : m.id)}
                          className={cn(
                            "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                            sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sadhana frequency</p>
                  <div className="flex flex-wrap gap-2">
                    {sadhanaFrequencies.map((s) => {
                      const sel = optionalSadhana === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setOptionalSadhana(sel ? "" : s.id)}
                          className={cn(
                            "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                            sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            disabled={submitting}
            onClick={() => void next()}
            className="w-full h-13 py-6 bg-gradient-saffron text-primary-foreground shadow-warm text-base font-medium"
          >
            {submitting ? "Saving…" : step === TOTAL - 1 ? "Enter AatmamIlan" : "Continue"}{" "}
            {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default Onboarding;
