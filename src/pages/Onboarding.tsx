import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
<<<<<<< HEAD
import { gurus, meditationTypes, practices } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";
import { updateUserProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
=======
import { gurus, meditationTypes, practices } from "@/data/dummy";
import { cn } from "@/lib/utils";
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682

const TOTAL = 5;

const Onboarding = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<string>("");
  const [guru, setGuru] = useState<string>("");
  const [med, setMed] = useState<string[]>([]);
  const [prac, setPrac] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

<<<<<<< HEAD
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

    const result = await updateUserProfile(user.id, {
      full_name: name.trim() || null,
      guru: guru || null,
      practices: prac,
    });

    if (!result.ok) {
      toast.error(result.error ?? "Could not save your profile.");
      return;
    }

    nav("/app");
  };
=======
  const next = () => (step < TOTAL - 1 ? setStep(step + 1) : nav("/app"));
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682
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
            <div className="relative h-[340px] mt-8 mb-4 mx-auto w-full max-w-sm">
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative h-72 w-72 animate-spin-slow" style={{ animationDuration: "60s" }}>
                  {gurus.map((g, i) => {
                    const angle = (i / gurus.length) * 2 * Math.PI;
                    const x = Math.cos(angle - Math.PI / 2) * 120;
                    const y = Math.sin(angle - Math.PI / 2) * 120;
                    const selected = guru === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setGuru(g.id)}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                        className={cn(
                          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full grid place-items-center text-xs font-medium text-center px-1 transition-all border-2",
                          selected ? "bg-gradient-saffron text-primary-foreground border-primary shadow-warm scale-110" : "bg-card border-border/60 text-foreground hover:border-primary"
                        )}
                      >
                        <span className="leading-tight" style={{ animation: "spin-slow 60s linear infinite reverse" }}>
                          {g.name.split(" ")[0]}
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
            {guru && (
              <div className="text-center animate-fade-in">
                <p className="font-serif text-2xl">{gurus.find((g) => g.id === guru)?.name}</p>
                <p className="text-sm text-muted-foreground">{gurus.find((g) => g.id === guru)?.tradition}</p>
              </div>
            )}
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
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto">Your sacred profile is ready. May this journey lead you to a soul that mirrors your own.</p>
            <div className="glass-card rounded-2xl p-5 mt-8 text-left space-y-2">
              {guru && <Row label="Guru" value={gurus.find(g => g.id === guru)?.name || ""} />}
              <Row label="Meditation" value={`${med.length} selected`} />
              <Row label="Practices" value={`${prac.length} selected`} />
              <Row label="Seeking" value={intent || "—"} />
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-5 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto">
<<<<<<< HEAD
          <Button onClick={() => void next()} className="w-full h-13 py-6 bg-gradient-saffron text-primary-foreground shadow-warm text-base font-medium">
=======
          <Button onClick={next} className="w-full h-13 py-6 bg-gradient-saffron text-primary-foreground shadow-warm text-base font-medium">
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682
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
