import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Check, Lock, Sparkles, Crown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { startPremiumPayment } from "@/lib/payment";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const plans = [
  { id: "seeker", name: "Seeker", price: "Free", period: "", features: ["5 matches/day", "Community feed", "Basic profile"] },
  { id: "sacred", name: "Sacred", price: "₹499", period: "/mo", popular: true, features: ["Unlimited matches", "See who blessed you", "Priority chat", "Event RSVPs", "Advanced filters"] },
  { id: "moksha", name: "Moksha", price: "₹1,499", period: "/mo", features: ["Everything in Sacred", "Personal matchmaker", "Retreat invitations", "Verified badge", "Astrological matching"] },
];

const Subscription = () => {
  const [selected, setSelected] = useState("sacred");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingStatus(false);
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("plan,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (data) {
        setCurrentPlan(data.plan);
        setCurrentStatus(data.status);
        setSelected(data.plan === "premium" ? "sacred" : "seeker");
      }
      setLoadingStatus(false);
    };
    void loadStatus();
  }, []);

  const handleUpgradeClick = async () => {
    if (selected === "seeker") {
      if (currentPlan === "premium" && currentStatus === "active") {
        toast("You will stay on free after your premium expires.");
      } else {
        toast.success("You are on the free plan.");
      }
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const result = await startPremiumPayment();
    setIsProcessing(false);

    if (!result.ok) {
      if (result.error && result.error !== "Payment cancelled") {
        toast.error(result.error);
      }
      return;
    }

    toast.success("Premium subscription activated.");
    setCurrentPlan("premium");
    setCurrentStatus("active");
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subscription cancelled. You keep premium until the end of your billing period.");
    setCurrentStatus("cancelled");
  };

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="AatmamIlan Sacred" subtitle="Walk the path with full grace" back />

      <div className="px-5">
        {/* Current Plan Status */}
        {!loadingStatus && currentPlan === "premium" && currentStatus === "active" && (
          <div className="glass-card rounded-2xl p-4 bg-gradient-saffron/10 border border-primary/30 mb-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Sacred Premium Active</p>
                  <p className="text-xs text-muted-foreground">Unlimited matches & full access</p>
                </div>
              </div>
              <button
                onClick={() => void handleCancel()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
            </div>
          </div>
        )}

        {!loadingStatus && currentPlan === "premium" && currentStatus === "cancelled" && (
          <div className="glass-card rounded-2xl p-4 bg-secondary/60 border border-border/60 mb-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Premium Ending Soon</p>
                <p className="text-xs text-muted-foreground">Your access continues until the billing period ends</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-5 bg-gradient-dusk text-ivory mb-6 relative overflow-hidden">
          <Sparkles className="absolute -top-4 -right-4 h-32 w-32 text-primary-glow/20" />
          <p className="text-xs uppercase tracking-[0.3em] text-primary-glow">Premium</p>
          <p className="font-serif text-3xl mt-2 leading-tight">Unlock the full sangha</p>
          <p className="text-sm opacity-80 mt-2 max-w-xs">Deeper connections. Exclusive retreats. Sacred guidance.</p>
        </div>

        <div className="space-y-3">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "w-full text-left p-5 rounded-2xl border-2 transition-all relative",
                selected === p.id ? "border-primary bg-primary/5 shadow-warm" : "border-border/60 bg-card hover:border-primary/40"
              )}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full bg-gradient-saffron text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  Most chosen
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl">{p.name}</h3>
                <p className="font-serif text-2xl">
                  {p.price}<span className="text-sm text-muted-foreground font-sans">{p.period}</span>
                </p>
              </div>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <Button onClick={() => void handleUpgradeClick()} disabled={isProcessing} className="w-full h-13 py-6 mt-6 bg-gradient-saffron text-primary-foreground shadow-warm text-base font-medium">
          {selected === "seeker" ? "Continue free" : "Begin sacred journey →"}
        </Button>

        {/* Locked features preview */}
        <div className="mt-10">
          <h3 className="font-serif text-2xl mb-4">Inside Sacred</h3>
          <div className="grid grid-cols-2 gap-3">
            {["Who blessed you", "Astro match", "Retreat access", "Verified badge"].map((f) => (
              <div key={f} className="aspect-square rounded-2xl bg-card border border-border/60 p-4 flex flex-col justify-between relative overflow-hidden">
                <Lock className="h-5 w-5 text-primary" />
                <p className="font-medium text-sm">{f}</p>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 italic">
          Cancel anytime · Sacred space, no spam
        </p>
      </div>
    </div>
  );
};

export default Subscription;
