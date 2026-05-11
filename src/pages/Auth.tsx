import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { getCurrentSession, resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail, upsertPublicUser } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/db";

const Auth = () => {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        nav(isProfileComplete(profile) ? "/app" : "/onboarding", { replace: true });
      }
    };

    void checkActiveSession();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        return;
      }

      await upsertPublicUser(session.user);
      const profile = await getCurrentUserProfile();
      nav(isProfileComplete(profile) ? "/app" : "/onboarding", { replace: true });
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [nav]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const result = await signInWithGoogle();
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

    if (method === "phone") {
      nav("/auth/otp");
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
      nav(isProfileComplete(profile) ? "/app" : "/onboarding", { replace: true });
      return;
    }

    toast.success("Account created. Check your email to verify your account.");
  };

  return (
    <div className="min-h-screen bg-gradient-dawn flex flex-col">
      <header className="px-5 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8 animate-fade-in">
          <span className="text-4xl">🪔</span>
          <h1 className="font-serif text-4xl mt-3">
            {mode === "forgot" ? "Reset password" : mode === "signin" ? "Welcome back" : "Begin your journey"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "forgot"
              ? "We'll send you a reset link"
              : mode === "signin"
                ? "Continue your sacred search"
                : "Create your spiritual profile"}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="flex gap-2 p-1 bg-secondary/60 rounded-full mb-6 animate-scale-in">
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === "email" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              <Mail className="h-4 w-4" /> Email
            </button>
            <button
              onClick={() => setMethod("phone")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${method === "phone" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              <Phone className="h-4 w-4" /> Phone
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your beautiful name"
                className="h-12 bg-card border-border/60"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>{mode === "forgot" || method === "email" ? "Email" : "Phone number"}</Label>
            <Input
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              type={mode === "forgot" || method === "email" ? "email" : "tel"}
              placeholder={mode === "forgot" || method === "email" ? "you@soul.com" : "+91 98765 43210"}
              className="h-12 bg-card border-border/60"
            />
          </div>
          {mode !== "forgot" && method === "email" && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 bg-card border-border/60"
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-saffron text-primary-foreground shadow-warm font-medium"
          >
            {mode === "forgot"
              ? "Send reset link"
              : method === "phone"
                ? "Send OTP"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
          </Button>
        </form>

        {mode === "signin" && method === "email" && (
          <button
            onClick={() => { setMode("forgot"); setPassword(""); }}
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

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 bg-card border-border/60 hover:bg-secondary w-full"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          {mode === "forgot" ? (
            <>
              Remember your password?{" "}
              <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
                Sign in
              </button>
            </>
          ) : mode === "signin" ? (
            <>
              New to AatmamIlan?{" "}
              <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
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
