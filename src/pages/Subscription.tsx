import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Check, Lock, Sparkles, Crown, X, Star, Moon, Sun, Infinity, Gem, Telescope, Flame, Users, MessageCircle, CalendarDays, ShieldCheck, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { startPremiumPayment } from "@/lib/payment";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

/* ─── Plan definitions ─── */
type PlanId = "seeker" | "sacred" | "moksha";

interface PlanDef {
  id: PlanId;
  name: string;
  sanskrit: string;
  price: string;
  period: string;
  validity: string;
  color: string;
  icon: typeof Crown;
  popular?: boolean;
  tagline: string;
  features: { text: string; included: boolean }[];
  notIncluded: string[];
}

const plans: PlanDef[] = [
  {
    id: "seeker",
    name: "Seeker",
    sanskrit: "प्रारंभिक",
    price: "Free",
    period: "",
    validity: "3 Months",
    color: "from-stone-400/20 to-stone-500/5",
    icon: Moon,
    tagline: "Begin the inner journey. Explore the sangha.",
    features: [
      { text: "Community Sangha feed access", included: true },
      { text: "Browse all profiles", included: true },
      { text: "5 Connection requests/day", included: true },
      { text: "Basic spiritual compatibility", included: true },
      { text: "Astro matching preview (3 pts)", included: true },
      { text: "Chat & Connect", included: false },
      { text: "Unlimited requests", included: false },
      { text: "Full Guna Milan (36 pts)", included: false },
      { text: "Priority in discovery", included: false },
      { text: "Verified sacred badge", included: false },
      { text: "Retreat & Event RSVP", included: false },
      { text: "Personal matchmaker guidance", included: false },
    ],
    notIncluded: ["Chat remains blocked even after mutual accept", "Cannot view who blessed you", "No video calls", "No advanced filters"],
  },
  {
    id: "sacred",
    name: "Sacred",
    sanskrit: "पवित्र",
    price: "₹499",
    period: "",
    validity: "6 Months",
    color: "from-primary/30 to-primary/5",
    icon: Sun,
    popular: true,
    tagline: "Walk deeper. Unveil the full resonance.",
    features: [
      { text: "Community Sangha feed access", included: true },
      { text: "Browse all profiles", included: true },
      { text: "Unlimited connection requests", included: true },
      { text: "Advanced spiritual compatibility", included: true },
      { text: "Full Guna Milan — 36 points", included: true },
      { text: "Unlimited chat with matches", included: true },
      { text: "See who blessed you", included: true },
      { text: "Priority placement in discovery", included: true },
      { text: "Verified sacred badge", included: true },
      { text: "Retreat & Event RSVP", included: true },
      { text: "Video calls with matches", included: true },
      { text: "Personal matchmaker guidance", included: false },
    ],
    notIncluded: ["No personal matchmaker"],
  },
  {
    id: "moksha",
    name: "Moksha",
    sanskrit: "मोक्ष",
    price: "₹1,499",
    period: "",
    validity: "Until Union",
    color: "from-amber-400/30 to-amber-500/5",
    icon: Infinity,
    tagline: "The final path. Guided until divine union.",
    features: [
      { text: "Community Sangha feed access", included: true },
      { text: "Browse all profiles", included: true },
      { text: "Unlimited connection requests", included: true },
      { text: "Advanced spiritual compatibility", included: true },
      { text: "Full Guna Milan — 36 points", included: true },
      { text: "Unlimited chat with matches", included: true },
      { text: "See who blessed you", included: true },
      { text: "Top priority in discovery", included: true },
      { text: "Verified sacred badge", included: true },
      { text: "Retreat & Event RSVP", included: true },
      { text: "Video calls with matches", included: true },
      { text: "Personal matchmaker guidance", included: true },
    ],
    notIncluded: [],
  },
];

/* ─── Astro matching info ─── */
const gunaPoints = [
  { name: "Varna", max: 1, desc: "Spiritual temperament alignment" },
  { name: "Vashya", max: 2, desc: "Mutual influence & dominion" },
  { name: "Tara", max: 3, desc: "Birth star compatibility" },
  { name: "Yoni", max: 4, desc: "Nature & intimacy harmony" },
  { name: "Graha Maitri", max: 5, desc: "Planetary friendship" },
  { name: "Gana", max: 6, desc: "Temperament matching" },
  { name: "Bhakoot", max: 7, desc: "Life path prosperity" },
  { name: "Nadi", max: 8, desc: "Health & progeny resonance" },
];

const Subscription = () => {
  const [selected, setSelected] = useState<PlanId>("sacred");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingStatus(false); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("plan,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (data) {
        setCurrentPlan(data.plan);
        setCurrentStatus(data.status);
        const mapped: PlanId = data.plan === "moksha" ? "moksha" : data.plan === "premium" ? "sacred" : "seeker";
        setSelected(mapped);
      }
      setLoadingStatus(false);
    };
    void loadStatus();
  }, []);

  const handleUpgradeClick = async () => {
    if (selected === "seeker") {
      if (currentPlan && currentPlan !== "seeker" && currentStatus === "active") {
        toast("Your current membership will continue. You can downgrade after it completes.");
      } else {
        toast.success("You are on the Seeker path.");
      }
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    /* Pass the plan type to payment */
    const result = await startPremiumPayment(selected);
    setIsProcessing(false);

    if (!result.ok) {
      if (result.error && result.error !== "Payment cancelled") toast.error(result.error);
      return;
    }
    toast.success(`${selected === "sacred" ? "Sacred" : "Moksha"} path activated. Blessings on your journey.`);
    setCurrentPlan(selected === "moksha" ? "moksha" : "premium");
    setCurrentStatus("active");
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to release your sacred membership?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active");
    if (error) { toast.error(error.message); return; }
    toast.success("Membership released. You retain access until the cycle completes.");
    setCurrentStatus("cancelled");
  };

  const selectedPlan = plans.find((p) => p.id === selected)!;
  const isCurrentPlanActive = currentPlan === selected || (selected === "sacred" && currentPlan === "premium");

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Sacred Plans" subtitle="Choose your path on this journey" back />

      <div className="px-5">
        {/* ── Current Plan Banner ── */}
        {!loadingStatus && currentPlan && currentStatus === "active" && (
          <div className="glass-card rounded-2xl p-4 bg-gradient-saffron/10 border border-primary/30 mb-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">
                    {currentPlan === "moksha" ? "Moksha" : currentPlan === "premium" ? "Sacred" : "Seeker"} Path Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPlan === "moksha" ? "Until divine union" : currentPlan === "premium" ? "Sacred grace flowing" : "Exploring the sangha"}
                  </p>
                </div>
              </div>
              {currentPlan !== "seeker" && (
                <button onClick={() => void handleCancel()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-3 w-3" /> Release
                </button>
              )}
            </div>
          </div>
        )}

        {!loadingStatus && currentPlan && currentStatus === "cancelled" && (
          <div className="glass-card rounded-2xl p-4 bg-secondary/60 border border-border/60 mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Membership Completing</p>
                <p className="text-xs text-muted-foreground">Your grace remains until this cycle ends. Renew when called.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero ── */}
        <div className="glass-card rounded-2xl p-5 bg-gradient-dusk text-ivory mb-6 relative overflow-hidden">
          <Sparkles className="absolute -top-4 -right-4 h-32 w-32 text-primary-glow/20" />
          <p className="text-xs uppercase tracking-[0.3em] text-primary-glow">Sacred Union</p>
          <p className="font-serif text-3xl mt-2 leading-tight">Three paths, one truth</p>
          <p className="text-sm opacity-80 mt-2 max-w-xs">Each step is ordained. Choose the depth of your sacred journey.</p>
        </div>

        {/* ── Plan Selector Cards ── */}
        <div className="space-y-3">
          {plans.map((p) => {
            const Icon = p.icon;
            const isSel = selected === p.id;
            const isCurrent = (p.id === "sacred" && currentPlan === "premium") || (p.id === "moksha" && currentPlan === "moksha") || (p.id === "seeker" && (!currentPlan || currentPlan === "seeker"));
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "w-full text-left rounded-2xl border-2 transition-all relative overflow-hidden",
                  isSel ? "border-primary bg-primary/5 shadow-warm" : "border-border/60 bg-card hover:border-primary/40"
                )}
              >
                {p.popular && (
                  <span className="absolute -top-2 right-4 px-2.5 py-0.5 rounded-full bg-gradient-saffron text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-warm">
                    Most chosen
                  </span>
                )}
                <div className={cn("p-5 bg-gradient-to-br", p.color)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-11 w-11 rounded-full grid place-items-center", isSel ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-serif text-2xl">{p.name}</h3>
                          <span className="text-[10px] text-muted-foreground font-medium tracking-wider">{p.sanskrit}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-2xl">{p.price}</p>
                      <p className="text-[10px] text-muted-foreground">{p.validity}</p>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.features.filter((f) => f.included).slice(0, 5).map((f) => (
                      <span key={f.text} className="px-2 py-0.5 rounded-full bg-background/60 text-[10px] font-medium">
                        {f.text}
                      </span>
                    ))}
                    {p.features.filter((f) => f.included).length > 5 && (
                      <span className="px-2 py-0.5 rounded-full bg-background/60 text-[10px] font-medium">
                        +{p.features.filter((f) => f.included).length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Detailed Feature Comparison ── */}
        <div className="mt-6">
          <h3 className="font-serif text-xl mb-3 flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" /> Features on this path
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden">
            {selectedPlan.features.map((f, i) => (
              <div key={i} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border/30")}>
                {f.included ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={cn("text-sm", !f.included && "text-muted-foreground/50 line-through")}>{f.text}</span>
              </div>
            ))}
          </div>

          {selectedPlan.notIncluded.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> Not included: {selectedPlan.notIncluded.join(" · ")}
              </p>
            </div>
          )}
        </div>

        {/* ── Astro Matching Section ── */}
        <div className="mt-8">
          <h3 className="font-serif text-xl mb-3 flex items-center gap-2">
            <Telescope className="h-5 w-5 text-primary" /> Guna Milan — Astro Matching
          </h3>
          <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Ancient Vedic astrology analyzes <strong className="text-foreground">36 sacred points</strong> across 8 dimensions of compatibility. The higher the score, the deeper the divine resonance between two souls.
            </p>

            <div className="space-y-2.5">
              {gunaPoints.map((g) => {
                const isUnlocked = selected !== "seeker";
                const previewOnly = selected === "seeker";
                return (
                  <div key={g.name} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full grid place-items-center text-xs font-bold shrink-0", isUnlocked ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                      {isUnlocked ? g.max : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", !isUnlocked && "text-muted-foreground/60")}>{g.name}</p>
                      <p className="text-[11px] text-muted-foreground">{g.desc}</p>
                    </div>
                    {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selected === "seeker" ? "Preview: 3 of 36 points" : selected === "sacred" ? "Full: 36 points" : "Full: 36 points + Matchmaker insights"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {selected === "seeker" ? "Upgrade to Sacred for complete Guna Milan" : "Complete cosmic compatibility analysis"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Sacred Assurance ── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: ShieldCheck, label: "Secure Payments", desc: "Razorpay encrypted" },
            { icon: Flame, label: "No Auto-Renew", desc: "You choose to continue" },
            { icon: Users, label: "Real Souls", desc: "Verified community" },
            { icon: CalendarDays, label: "Cancel Anytime", desc: "Full grace period" },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-xl p-3 border border-border/40 flex items-center gap-2.5">
              <item.icon className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <Button
          onClick={() => void handleUpgradeClick()}
          disabled={isProcessing || (isCurrentPlanActive && currentStatus === "active")}
          className={cn(
            "w-full h-14 mt-8 text-base font-medium shadow-warm",
            selected === "seeker"
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : "bg-gradient-saffron text-primary-foreground"
          )}
        >
          {isProcessing
            ? "Processing..."
            : isCurrentPlanActive && currentStatus === "active"
              ? "Your current path"
              : selected === "seeker"
                ? "Continue as Seeker"
                : selected === "sacred"
                  ? "Begin Sacred journey →"
                  : "Enter the path of Moksha →"}
        </Button>

        {selected !== "seeker" && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            By proceeding, you accept our sacred terms of service
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground/50 mt-6 pb-4">
          Questions? Reach us at support@aatmamilan.com · GST included
        </p>
      </div>
    </div>
  );
};

export default Subscription;
