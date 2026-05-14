import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ArrowRight, Check, ChevronDown } from "lucide-react";
import {
  gurus,
  marriageTimelines,
  meditationTypes,
  optionLabel,
  practices,
  sadhanaFrequencies,
  spiritualPaths,
  type GuruEntry,
} from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";
import { updateUserProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/db";

const TOTAL = 5;

const deriveSpiritualPath = (medIds: string[]): string | null => {
  if (medIds.includes("kriya")) {
    return "kriya";
  }
  if (medIds.includes("bhakti")) {
    return "bhakti";
  }
  if (medIds.includes("mindfulness") || medIds.includes("vipassana")) {
    return "mindfulness";
  }
  if (medIds.includes("mantra")) {
    return "bhakti";
  }
  if (medIds.includes("silence")) {
    return "advaita";
  }
  return medIds.length ? "integral" : null;
};

const deriveMeditationExperience = (medIds: string[]): string | null => {
  if (medIds.length >= 5) {
    return "deep";
  }
  if (medIds.length >= 3) {
    return "steady";
  }
  if (medIds.length >= 1) {
    return "beginner";
  }
  return null;
};

const deriveSadhanaFromPractices = (pracIds: string[]): string => {
  if (pracIds.length >= 5) {
    return "daily_twice";
  }
  if (pracIds.length >= 2) {
    return "daily_once";
  }
  return "most_days";
};

const GuruDetailCard = ({ g }: { g: GuruEntry }) => (
  <div className="glass-card rounded-2xl p-4 mt-6 text-left space-y-3 animate-fade-in">
    <div className="flex gap-4 items-start">
      {g.imageUrl ? (
        <img
          src={g.imageUrl}
          alt=""
          className="h-16 w-16 rounded-full object-cover shrink-0 border border-border/50"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-primary/10 border border-border/50 shrink-0 grid place-items-center text-lg text-primary font-serif">
          ॐ
        </div>
      )}
      <div className="min-w-0 space-y-1">
        <p className="font-serif text-xl leading-tight">{g.name}</p>
        <p className="text-xs text-muted-foreground">{g.tradition}</p>
        {g.lineage ? <p className="text-xs text-foreground/80 leading-snug">{g.lineage}</p> : null}
        {g.bio ? <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{g.bio}</p> : null}
      </div>
    </div>
  </div>
);

const Onboarding = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<string>("");
  const [guru, setGuru] = useState<string>("");
  const [med, setMed] = useState<string[]>([]);
  const [prac, setPrac] = useState<string[]>([]);
  const [optionalMarriage, setOptionalMarriage] = useState("");
  const [optionalSadhana, setOptionalSadhana] = useState("");
  const [optionalRefineOpen, setOptionalRefineOpen] = useState(false);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const selectedGuru = guru ? gurus.find((x) => x.id === guru) : undefined;
  const previewSpiritualPath = deriveSpiritualPath(med) ?? "integral";

  useEffect(() => {
    let mounted = true;

    const guardCompletedProfile = async () => {
      const profile = await getCurrentUserProfile();
      if (mounted && isProfileComplete(profile)) {
        nav("/app", { replace: true });
      }
      if (mounted && profile && !isProfileComplete(profile)) {
        if (profile.full_name?.trim()) {
          setName(profile.full_name.trim());
        }
        if (profile.guru?.trim()) {
          setGuru(profile.guru.trim());
        }
        if (profile.practices?.length) {
          setPrac(profile.practices);
        }
        if (profile.marriage_timeline?.trim()) {
          setOptionalMarriage(profile.marriage_timeline.trim());
        }
        if (profile.sadhana_frequency?.trim()) {
          setOptionalSadhana(profile.sadhana_frequency.trim());
        }
      }
    };

    void guardCompletedProfile();

    return () => {
      mounted = false;
    };
  }, [nav]);

  const next = async () => {
    if (step < TOTAL - 1) {
      setStep(step + 1);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please sign in to continue.");
      nav("/auth");
      return;
    }

    const existingProfile = await getCurrentUserProfile();
    const derivedGender =
      existingProfile?.gender?.trim() ||
      "unspecified";
    const derivedSeekingGender =
      intent === "Bride"
        ? "female"
        : intent === "Groom"
          ? "male"
          : existingProfile?.seeking_gender?.trim() || "any";
    const derivedAge = existingProfile?.age ?? 18;
    const derivedCity = existingProfile?.city?.trim() || "Unknown";
    const derivedBio =
      existingProfile?.bio?.trim() ||
      "On a spiritual journey seeking a conscious connection.";
    const derivedGuru = guru || existingProfile?.guru || gurus[0]?.id || "spiritual_path";
    const selectedPractices = prac.length > 0 ? prac : ["yoga"];
    const spiritualPath = deriveSpiritualPath(med) ?? existingProfile?.spiritual_path ?? "integral";
    const sadhanaFrequency =
      optionalSadhana.trim() || deriveSadhanaFromPractices(selectedPractices);
    const marriageTimeline = optionalMarriage.trim() || "when_ready";

    const result = await updateUserProfile(user.id, {
      full_name: name.trim() || null,
      gender: derivedGender,
      seeking_gender: derivedSeekingGender,
      age: derivedAge,
      city: derivedCity,
      bio: derivedBio,
      guru: derivedGuru,
      practices: selectedPractices,
      spiritual_path: spiritualPath,
      sadhana_frequency: sadhanaFrequency,
      marriage_timeline: marriageTimeline,
      meditation_experience: deriveMeditationExperience(med),
      seva_inclination: selectedPractices.includes("seva") ? "daily_small" : null,
      programs_undergone: existingProfile?.programs_undergone?.length ? existingProfile.programs_undergone : [],
      spiritual_values: existingProfile?.spiritual_values?.length ? existingProfile.spiritual_values : [],
      onboarding_completed: true,
    });

    if (!result.ok) {
      toast.error(result.error ?? "Could not save your profile.");
      return;
    }

    nav("/app");
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
        <button onClick={() => nav("/app")} className="text-xs text-muted-foreground hover:text-foreground">Skip</button>
      </header>

      <main className="flex-1 px-6 max-w-md mx-auto w-full pb-24 overflow-y-auto">
        {step === 0 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 1 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">What shall we call you?</h2>
            <p className="text-muted-foreground mt-2">Your name carries a vibration. Share it with us.</p>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya" className="h-14 mt-8 bg-card border-border/60 text-lg" />
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">I am seeking</p>
              <div className="grid grid-cols-3 gap-2">
                {["Bride", "Groom", "Friend"].map((o) => (
                  <button key={o} onClick={() => setIntent(o)}
                    className={cn("py-3 rounded-xl border text-sm font-medium transition-all",
                      intent === o ? "bg-primary text-primary-foreground border-primary shadow-warm" : "bg-card border-border/60 hover:border-primary/40")}>
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
            <h2 className="font-serif text-4xl leading-tight">Choose your Guru</h2>
            <p className="text-muted-foreground mt-2">The one whose path you walk.</p>

            {/* Guru Wheel */}
            <div className="relative h-[360px] mt-8 mb-4 mx-auto w-full max-w-sm">
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative h-72 w-72 animate-spin-slow" style={{ animationDuration: "88s" }}>
                  {gurus.map((g, i) => {
                    const n = gurus.length;
                    const angle = (i / n) * 2 * Math.PI;
                    const radius = n <= 8 ? 118 : 128;
                    const x = Math.cos(angle - Math.PI / 2) * radius;
                    const y = Math.sin(angle - Math.PI / 2) * radius;
                    const selected = guru === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGuru(g.id)}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                        className={cn(
                          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[4.25rem] w-[4.25rem] rounded-full grid place-items-center text-[11px] font-medium text-center leading-tight px-0.5 transition-all border-2 overflow-hidden",
                          selected ? "bg-gradient-saffron text-primary-foreground border-primary shadow-warm scale-110 ring-2 ring-primary/30" : "bg-card border-border/60 text-foreground hover:border-primary"
                        )}
                      >
                        <span
                          className="relative z-10 block w-full px-0.5"
                          style={{ animation: "spin-slow 88s linear infinite reverse" }}
                        >
                          {g.imageUrl ? (
                            <span className="flex flex-col items-center gap-0.5">
                              <img src={g.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-white/30" />
                              <span className="line-clamp-2">{g.name.split(" ")[0]}</span>
                            </span>
                          ) : (
                            <span className="line-clamp-2">{g.name.split(" ")[0]}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="h-24 w-24 rounded-full bg-gradient-gold grid place-items-center shadow-warm animate-breathe">
                  <span className="text-3xl">ॐ</span>
                </div>
              </div>
            </div>
            {selectedGuru ? <GuruDetailCard g={selectedGuru} /> : null}
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 3 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">How do you meditate?</h2>
            <p className="text-muted-foreground mt-2">Select all that resonate.</p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {meditationTypes.map((m) => {
                const sel = med.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggle(med, setMed, m.id)}
                    className={cn("p-5 rounded-2xl border-2 text-left transition-all",
                      sel ? "bg-primary/10 border-primary shadow-warm" : "bg-card border-border/60 hover:border-primary/40")}>
                    <div className="text-3xl mb-2">{m.icon}</div>
                    <div className="font-medium">{m.label}</div>
                    {sel && <Check className="h-4 w-4 text-primary mt-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in pt-8">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3">Step 4 of 5</p>
            <h2 className="font-serif text-4xl leading-tight">Your daily practices</h2>
            <p className="text-muted-foreground mt-2">What grounds your every day?</p>
            <div className="flex flex-wrap gap-2 mt-8">
              {practices.map((p) => {
                const sel = prac.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggle(prac, setPrac, p.id)}
                    className={cn("px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                      sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40")}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in pt-8 text-center">
            <div className="h-24 w-24 mx-auto rounded-full bg-gradient-saffron grid place-items-center shadow-warm animate-breathe">
              <span className="text-4xl">🪷</span>
            </div>
            <h2 className="font-serif text-4xl mt-6">Welcome, {name || "seeker"}</h2>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto">Your profile is ready. May this journey lead you toward a soul that mirrors your own.</p>
            <div className="glass-card rounded-2xl p-5 mt-8 text-left space-y-2">
              {guru && <Row label="Guru" value={gurus.find((g) => g.id === guru)?.name || ""} />}
              <Row label="Path" value={optionLabel(spiritualPaths, previewSpiritualPath)} />
              <Row label="Meditation" value={`${med.length} selected`} />
              <Row label="Practices" value={`${prac.length} selected`} />
              <Row label="Seeking" value={intent || "—"} />
              <Row
                label="Marriage intention"
                value={optionalMarriage ? optionLabel(marriageTimelines, optionalMarriage) : "When the soul is ready (default)"}
              />
              <Row
                label="Sadhana rhythm"
                value={
                  optionalSadhana ? optionLabel(sadhanaFrequencies, optionalSadhana) : "Gentle default from your practices"
                }
              />
            </div>

            <Collapsible open={optionalRefineOpen} onOpenChange={setOptionalRefineOpen} className="mt-6 text-left">
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>Optional — refine intention & rhythm</span>
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
          <Button onClick={() => void next()} className="w-full h-13 py-6 bg-gradient-saffron text-primary-foreground shadow-warm text-base font-medium">
            {step === TOTAL - 1 ? "Enter AatmamIlan" : "Continue"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Onboarding;
