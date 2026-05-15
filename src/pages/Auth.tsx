import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  getCurrentSession,
  resetPassword,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  upsertPublicUser,
} from "@/lib/auth";

import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/db";

const guruPresence = [
  {
    name: "Bade Mandir Guruji",
    quote: "Shukrana Guruji.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Guruji_Bade_Mandir.jpg",
  },
  {
    name: "Neem Karoli Baba",
    quote: "Love everyone. Serve everyone.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Neem_Karoli_Baba.jpg",
  },
  {
    name: "Anandamayi Ma",
    quote: "Silence also teaches.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/70/Anandamayi_Ma_1987.jpg",
  },
  {
    name: "Kabir",
    quote: "The guest is within.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/7d/Kabir_das.jpg",
  },
  {
    name: "Radhasoami",
    quote: "Surat finds its home within.",
    image:
      "https://radhasoami.net/images/swami-ji-maharaj.jpg",
  },
];

const Auth = () => {
  const nav = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [guruIndex, setGuruIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const checkActiveSession = async () => {
      const session = await getCurrentSession();

      if (!isMounted) {
        return;
      }

      if (session) {
        await upsertPublicUser(session.user);

        const profile = await getCurrentUserProfile();

        nav(isProfileComplete(profile) ? "/app" : "/onboarding", {
          replace: true,
        });
      }
    };

    void checkActiveSession();

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          return;
        }

        await upsertPublicUser(session.user);

        const profile = await getCurrentUserProfile();

        nav(isProfileComplete(profile) ? "/app" : "/onboarding", {
          replace: true,
        });
      }
    );

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [nav]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGuruIndex((prev) => (prev + 1) % guruPresence.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);

    const result = await signInWithGoogle();

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    }
  };

  const handleAppleSignIn = async () => {
    setIsSubmitting(true);

    const result = await signInWithApple();

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode === "forgot") {
      if (!emailOrPhone.trim()) {
        toast.error("Please enter your email.");
        return;
      }

      setIsSubmitting(true);

      const result = await resetPassword(emailOrPhone.trim());

      setIsSubmitting(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Password reset link sent. Check your email.");
      setMode("signin");

      return;
    }

    if (!emailOrPhone.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    const email = emailOrPhone.trim();

    const result =
      mode === "signin"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, fullName.trim());

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (mode === "signin") {
      const profile = await getCurrentUserProfile();

      nav(isProfileComplete(profile) ? "/app" : "/onboarding", {
        replace: true,
      });

      return;
    }

    toast.success(
      "Account created. Check your email to verify your account."
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F3EA] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_45%)]" />

      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/rice-paper-3.png')]" />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#4B2E1E] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="bg-[#FCF8F2]/90 backdrop-blur-sm border border-[#EADBC8] rounded-[32px] px-6 py-8 shadow-2xl overflow-hidden relative">

          <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(circle_at_top,rgba(255,183,77,0.15),transparent_70%)]" />

          <div className="text-center mb-10 relative z-10 overflow-hidden">

            <div className="mb-5">
              <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#f6eee3]/80 border border-[#eadbc8] text-[#9c6b3d] text-[10px] tracking-[0.35em] uppercase">
                Inner Companionship
              </div>
            </div>

            <div className="relative mx-auto w-[160px] h-[160px] mb-7">

              <div className="absolute inset-0 rounded-full bg-orange-200/40 blur-3xl animate-pulse" />

              <div className="absolute inset-0 rounded-full border border-[#ead8c2]" />

              <img
                src={guruPresence[guruIndex].image}
                alt={guruPresence[guruIndex].name}
                className="w-full h-full object-cover rounded-full shadow-2xl transition-all duration-1000"
              />

              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-3xl">
                🪷
              </div>
            </div>

            <h1 className="font-serif text-5xl text-[#4B2E1E] tracking-tight">
              AatmaMilan
            </h1>

            <p className="mt-4 text-[#7b6250] text-sm leading-relaxed px-6">
              A quiet space for seekers, companionship,
              devotion and inner connection.
            </p>

            <div className="mt-6 px-8 min-h-[72px] transition-all duration-1000">

              <p className="italic text-[#6B4F3A] text-sm leading-relaxed">
                “{guruPresence[guruIndex].quote}”
              </p>

              <div className="mt-3 text-[11px] uppercase tracking-[0.28em] text-[#B08968]">
                {guruPresence[guruIndex].name}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label className="text-[#5F4938]">Full name</Label>

                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your beautiful name"
                  className="h-12 rounded-2xl border-[#E5D5C2] bg-white/80"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[#5F4938]">Email</Label>

              <Input
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="h-12 rounded-2xl border-[#E5D5C2] bg-white/80"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label className="text-[#5F4938]">Password</Label>

                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-2xl border-[#E5D5C2] bg-white/80"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-[#DE7A2D] hover:bg-[#C86C28] text-white shadow-lg transition-all duration-300 hover:scale-[1.01]"
            >
              {mode === "forgot"
                ? "Send reset link"
                : mode === "signin"
                ? "Enter the Sangha"
                : "Begin your path"}
            </Button>
          </form>

          {mode === "signin" && (
            <button
              onClick={() => {
                setMode("forgot");
                setPassword("");
              }}
              className="text-sm text-[#C46D2D] font-medium hover:underline mt-4 block mx-auto"
            >
              Forgot password?
            </button>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-[#9A846F]">
            <div className="h-px flex-1 bg-[#E2D3C1]" />

            <span>continue with</span>

            <div className="h-px flex-1 bg-[#E2D3C1]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-[#E2D3C1] bg-white/90 hover:bg-white text-[#4B2E1E] whitespace-nowrap transition-all duration-300 hover:scale-[1.01]"
              onClick={() => void handleGoogleSignIn()}
              disabled={isSubmitting}
            >
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-[#E2D3C1] bg-white/90 hover:bg-white text-[#4B2E1E] whitespace-nowrap transition-all duration-300 hover:scale-[1.01]"
              onClick={() => void handleAppleSignIn()}
              disabled={isSubmitting}
            >
              Continue with Apple
            </Button>
          </div>

          <p className="text-center text-[11px] text-[#9A846F] mt-5 leading-relaxed px-3">
            Honouring many teachers, traditions, and inward paths.
          </p>

          <p className="text-center text-sm text-[#7B6250] mt-8">
            {mode === "forgot" ? (
              <>
                Remember your password?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-[#C46D2D] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : mode === "signin" ? (
              <>
                New to AatmaMilan?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-[#C46D2D] font-medium hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-[#C46D2D] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
