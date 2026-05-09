import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const OTP = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const update = (i: number, v: string) => {
    const val = v.replace(/\D/, "").slice(-1);
    const next = [...code]; next[i] = val; setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const complete = code.every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-dawn flex flex-col items-center justify-center px-6">
      <div className="text-center mb-10 animate-fade-in">
        <div className="h-20 w-20 mx-auto rounded-full bg-gradient-saffron grid place-items-center shadow-warm animate-breathe">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="font-serif text-4xl mt-6">Verify your number</h1>
        <p className="text-muted-foreground text-sm mt-2">We sent a 6-digit code to +91 ••••• 43210</p>
      </div>

      <div className="flex gap-2 mb-8 animate-scale-in">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={c}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus(); }}
            inputMode="numeric"
            maxLength={1}
            className="h-14 w-12 rounded-2xl bg-card border border-border/60 text-center text-2xl font-serif focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        ))}
      </div>

      <Button onClick={() => nav("/onboarding")} disabled={!complete} className="w-full max-w-sm h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
        Verify & continue
      </Button>
      <button className="text-sm text-muted-foreground mt-6 hover:text-primary transition-colors">Resend code in 0:42</button>
    </div>
  );
};

export default OTP;
