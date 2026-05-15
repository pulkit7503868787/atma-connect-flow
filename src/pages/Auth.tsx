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
      "https://i.imgur.com/7aMnQZC.jpeg",
  },
  {
    name: "Kabir",
    quote: "Walk gently inward.",
    image:
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Anandamayi Ma",
    quote: "Silence also teaches.",
    image:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Neem Karoli Baba",
    quote: "Love quietly.",
    image:
      "https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Radhasoami",
    quote: "The inner path unfolds softly.",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=400&auto=format&fit=crop",
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
    <div className="min-h-screen bg-gradient-dawn flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.10),transparent_45%)]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/rice-paper-3.png')]" />

      <header className="px-5 pt-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full relative z-10">
        <div className="text-center mb-8 animate-fade-in relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.10),transparent_70%)] blur-3xl" />

          <div className="relative z-10">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-orange-200/40 blur-2xl animate-pulse" />

              <img
                src={guruPresence[guruIndex].image}
                alt={guruPresence[guruIndex].name}
                className="relative w-24 h-24 rounded-full object-cover border border-white/70 shadow-2xl transition-all duration-1000"
              />
            </div>

            <div className="text-[10px] uppercase tracking-[0.35em] text-[#B7791F] mb-2">
              Enter Gently
            </div>

            <h1 className="font-serif text-4xl text-[#4B2E1E] leading-none">
              {mode === "forgot"
                ? "Reset password"
                : mode === "signin"
                ? "Welcome back"
                : "Begin your journey"}
            </h1>

            <p className="text-muted-foreground text-sm mt-3">
              {mode === "forgot"
                ? "We'll send you a reset link"
                : mode === "signin"
                ? "Continue your inner search"
                : "Create your spiritual profile"}
            </p>

            <div className="mt-5 transition-all duration-1000">
              <p className="text-sm italic text-[#6B4F3A] px-6 leading-relaxed">
                “{guruPresence[guruIndex].quote}”
              </p>

              <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-[#B08968]">
                {guruPresence[guruIndex].name}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Full name</Label>

              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your beautiful name"
                className="h-12 bg-card/80 border-border/60"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Email</Label>

            <Input
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="h-12 bg-card/80 border-border/60"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label>Password</Label>

              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 bg-card/80 border-border/60"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-saffron text-primary-foreground shadow-warm font-medium hover:scale-[1.01] transition-all duration-300"
          >
            {mode === "forgot"
              ? "Send reset link"
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </Button>
        </form>

        {mode === "signin" && (
          <button
            onClick={() => {
              setMode("forgot");
              setPassword("");
            }}
            className="text-sm text-primary font-medium hover:underline mt-3 block mx-auto"
          >
            Forgot password?
          </button>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />

          <span>or continue with</span>

          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 min-h-[3rem] px-3 bg-card/80 border-border/60 hover:bg-secondary w-full text-sm whitespace-nowrap transition-all duration-300 hover:scale-[1.01]"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting}
          >
            <svg
              className="h-4 w-4 mr-2 shrink-0"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />

              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />

              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />

              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>

            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 min-h-[3rem] px-3 bg-card/80 border-border/60 hover:bg-secondary w-full text-sm whitespace-nowrap transition-all duration-300 hover:scale-[1.01]"
            onClick={() => void handleAppleSignIn()}
            disabled={isSubmitting}
          >
            <svg
              className="h-4 w-4 mr-2 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>

            Continue with Apple
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4 leading-relaxed px-2">
          Honouring many teachers, traditions, and inward paths.
        </p>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {mode === "forgot" ? (
            <>
              Remember your password?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          ) : mode === "signin" ? (
            <>
              New to AatmamIlan?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-primary font-medium hover:underline"
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;