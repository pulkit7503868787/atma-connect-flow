import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Users,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Ban,
  ToggleLeft,
  Crown,
  Search,
  ChevronDown,
  ChevronUp,
  Settings2,
  KeyRound,
  Save,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

/* ─── Types ─── */
type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_blocked: boolean;
  chat_disabled: boolean;
  profile_hidden: boolean;
  created_at: string;
  onboarding_completed: boolean;
};

type AdminSubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
  valid_until: string | null;
};

type AdminMessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type PlanFeatureConfig = {
  id: string;
  plan_name: string;
  can_chat: boolean;
  can_send_requests: boolean;
  daily_request_limit: number;
  can_superlike: boolean;
  daily_superlike_limit: number;
  can_see_who_liked: boolean;
  can_rsvp_events: boolean;
  can_video_call: boolean;
  has_matchmaker: boolean;
  has_verified_badge: boolean;
  can_view_full_astro: boolean;
  priority_in_discovery: boolean;
  validity_months: number | null;
};

type RazorpayConfig = {
  id?: string;
  key_id: string;
  key_secret: string;
  webhook_secret: string;
  test_mode: boolean;
  updated_at?: string;
};

const defaultPlanConfigs: PlanFeatureConfig[] = [
  {
    id: "seeker",
    plan_name: "Seeker (Free)",
    can_chat: false,
    can_send_requests: true,
    daily_request_limit: 5,
    can_superlike: false,
    daily_superlike_limit: 0,
    can_see_who_liked: false,
    can_rsvp_events: false,
    can_video_call: false,
    has_matchmaker: false,
    has_verified_badge: false,
    can_view_full_astro: false,
    priority_in_discovery: false,
    validity_months: 3,
  },
  {
    id: "sacred",
    plan_name: "Sacred (₹499)",
    can_chat: true,
    can_send_requests: true,
    daily_request_limit: 999,
    can_superlike: true,
    daily_superlike_limit: 3,
    can_see_who_liked: true,
    can_rsvp_events: true,
    can_video_call: true,
    has_matchmaker: false,
    has_verified_badge: true,
    can_view_full_astro: true,
    priority_in_discovery: true,
    validity_months: 6,
  },
  {
    id: "moksha",
    plan_name: "Moksha (₹1,499)",
    can_chat: true,
    can_send_requests: true,
    daily_request_limit: 999,
    can_superlike: true,
    daily_superlike_limit: 10,
    can_see_who_liked: true,
    can_rsvp_events: true,
    can_video_call: true,
    has_matchmaker: true,
    has_verified_badge: true,
    can_view_full_astro: true,
    priority_in_discovery: true,
    validity_months: null,
  },
];

const Admin = () => {
  const [tab, setTab] = useState<"users" | "plans" | "payments" | "messages">("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([]);
  const [msgs, setMsgs] = useState<AdminMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* Plan config state */
  const [planConfigs, setPlanConfigs] = useState<PlanFeatureConfig[]>(defaultPlanConfigs);
  const [savingConfig, setSavingConfig] = useState(false);

  /* Razorpay config */
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig>({
    key_id: "",
    key_secret: "",
    webhook_secret: "",
    test_mode: true,
  });
  const [savingRazorpay, setSavingRazorpay] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  /* User plan override */
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [overridePlan, setOverridePlan] = useState<Record<string, { plan: string; status: string; months: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [u, s, m] = await Promise.all([
      supabase.from("users").select("id,email,full_name,is_blocked,chat_disabled,profile_hidden,created_at,onboarding_completed").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("id,user_id,plan,status,created_at,updated_at,valid_until").order("updated_at", { ascending: false }),
      supabase.from("messages").select("id,chat_id,sender_id,content,created_at").order("created_at", { ascending: false }).limit(80),
    ]);
    setUsers((u.data ?? []) as AdminUserRow[]);
    setSubs((s.data ?? []) as AdminSubscriptionRow[]);
    setMsgs((m.data ?? []) as AdminMessageRow[]);

    /* Load plan configs from DB if available */
    const { data: pc } = await supabase.from("plan_configs").select("*");
    if (pc && pc.length > 0) {
      const mapped = defaultPlanConfigs.map((d) => {
        const found = pc.find((p) => p.plan_id === d.id);
        return found ? { ...d, ...found, validity_months: found.validity_months ?? d.validity_months } : d;
      });
      setPlanConfigs(mapped);
    }

    /* Load Razorpay config */
    const { data: rc } = await supabase.from("razorpay_config").select("*").maybeSingle();
    if (rc) {
      setRazorpayConfig({
        key_id: rc.key_id ?? "",
        key_secret: rc.key_secret ?? "",
        webhook_secret: rc.webhook_secret ?? "",
        test_mode: rc.test_mode ?? true,
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleBlocked = async (userId: string, next: boolean) => {
    const { error } = await supabase.from("users").update({ is_blocked: next }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "User blocked." : "User unblocked.");
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_blocked: next } : u)));
  };

  const toggleChat = async (userId: string, next: boolean) => {
    const { error } = await supabase.from("users").update({ chat_disabled: next }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "Chat disabled." : "Chat enabled.");
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, chat_disabled: next } : u)));
  };

  const removeMessage = async (messageId: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) { toast.error(error.message); return; }
    toast.success("Message removed.");
    setMsgs((prev) => prev.filter((m) => m.id !== messageId));
  };

  const savePlanConfigs = async () => {
    setSavingConfig(true);
    for (const pc of planConfigs) {
      await supabase.from("plan_configs").upsert({
        plan_id: pc.id,
        can_chat: pc.can_chat,
        can_send_requests: pc.can_send_requests,
        daily_request_limit: pc.daily_request_limit,
        can_superlike: pc.can_superlike,
        daily_superlike_limit: pc.daily_superlike_limit,
        can_see_who_liked: pc.can_see_who_liked,
        can_rsvp_events: pc.can_rsvp_events,
        can_video_call: pc.can_video_call,
        has_matchmaker: pc.has_matchmaker,
        has_verified_badge: pc.has_verified_badge,
        can_view_full_astro: pc.can_view_full_astro,
        priority_in_discovery: pc.priority_in_discovery,
        validity_months: pc.validity_months,
        updated_at: new Date().toISOString(),
      }, { onConflict: "plan_id" });
    }
    setSavingConfig(false);
    toast.success("Plan configurations saved.");
  };

  const saveRazorpayConfig = async () => {
    setSavingRazorpay(true);
    const { error } = await supabase.from("razorpay_config").upsert({
      id: 1,
      key_id: razorpayConfig.key_id,
      key_secret: razorpayConfig.key_secret,
      webhook_secret: razorpayConfig.webhook_secret,
      test_mode: razorpayConfig.test_mode,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    setSavingRazorpay(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Razorpay configuration saved.");
  };

  const handleManualSubscription = async (userId: string) => {
    const ov = overridePlan[userId];
    if (!ov) return;
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan: ov.plan,
      status: ov.status,
      valid_until: ov.months ? new Date(Date.now() + parseInt(ov.months) * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return; }
    toast.success(`Subscription updated to ${ov.plan}.`);
    setExpandedUser(null);
    void load();
  };

  const filteredUsers = users.filter((u) =>
    (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const getUserSub = (userId: string) => subs.find((s) => s.user_id === userId);

  return (
    <div className="min-h-screen bg-background animate-fade-in pb-24">
      <header className="px-5 pt-8 pb-4 border-b border-border/60 flex items-center gap-3">
        <Link to="/app" className="h-9 w-9 rounded-full bg-secondary grid place-items-center shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl leading-none">Sacred Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">Moderation, plans & payments</p>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 p-1 bg-secondary/40 mx-5 mt-4 rounded-xl">
        {[
          { key: "users" as const, label: "Souls", icon: Users },
          { key: "plans" as const, label: "Plans", icon: Crown },
          { key: "payments" as const, label: "Payments", icon: CreditCard },
          { key: "messages" as const, label: "Messages", icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto">
        {loading && <p className="text-sm text-muted-foreground">Loading sacred data...</p>}

        {!loading && tab === "users" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 bg-card border-border/60"
              />
            </div>

            <p className="text-xs text-muted-foreground">{filteredUsers.length} souls registered</p>

            <div className="space-y-3">
              {filteredUsers.map((u) => {
                const sub = getUserSub(u.id);
                const isExpanded = expandedUser === u.id;
                return (
                  <div key={u.id} className="glass-card rounded-2xl overflow-hidden border border-border/40">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{u.full_name || "Unnamed Soul"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">{u.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                          {sub && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              sub.plan === "moksha" ? "bg-amber-500/10 text-amber-600" :
                              sub.plan === "premium" ? "bg-primary/10 text-primary" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {sub.plan === "premium" ? "Sacred" : sub.plan === "moksha" ? "Moksha" : "Seeker"}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            u.is_blocked ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {u.is_blocked ? "Blocked" : "Active"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant={u.is_blocked ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => void toggleBlocked(u.id, !u.is_blocked)}>
                          {u.is_blocked ? "Unblock" : "Block"}
                        </Button>
                        <Button variant={u.chat_disabled ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => void toggleChat(u.id, !u.chat_disabled)}>
                          {u.chat_disabled ? "Enable Chat" : "Disable Chat"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                          <Settings2 className="h-3 w-3 mr-1" /> Sub
                          {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable subscription override */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3 bg-secondary/20">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Subscription Override</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px]">Plan</Label>
                            <select
                              value={overridePlan[u.id]?.plan ?? sub?.plan ?? "seeker"}
                              onChange={(e) => setOverridePlan((prev) => ({ ...prev, [u.id]: { ...prev[u.id], plan: e.target.value } }))}
                              className="w-full h-9 rounded-md border border-border/60 bg-card px-2 text-xs"
                            >
                              <option value="seeker">Seeker</option>
                              <option value="premium">Sacred</option>
                              <option value="moksha">Moksha</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Status</Label>
                            <select
                              value={overridePlan[u.id]?.status ?? sub?.status ?? "active"}
                              onChange={(e) => setOverridePlan((prev) => ({ ...prev, [u.id]: { ...prev[u.id], status: e.target.value } }))}
                              className="w-full h-9 rounded-md border border-border/60 bg-card px-2 text-xs"
                            >
                              <option value="active">Active</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="expired">Expired</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px]">Months</Label>
                            <Input
                              value={overridePlan[u.id]?.months ?? (sub?.valid_until ? "6" : "")}
                              onChange={(e) => setOverridePlan((prev) => ({ ...prev, [u.id]: { ...prev[u.id], months: e.target.value } }))}
                              placeholder="Lifetime"
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 text-xs bg-gradient-saffron text-primary-foreground" onClick={() => void handleManualSubscription(u.id)}>
                            <Save className="h-3 w-3 mr-1" /> Apply
                          </Button>
                          {sub && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              Current: {sub.plan} · {sub.status}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && tab === "plans" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Plan Feature Configuration</h2>
              <Button size="sm" className="h-8 text-xs bg-gradient-saffron text-primary-foreground" onClick={() => void savePlanConfigs()} disabled={savingConfig}>
                {savingConfig ? "Saving..." : "Save All"}
              </Button>
            </div>

            {planConfigs.map((pc) => (
              <div key={pc.id} className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg">{pc.plan_name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Validity: {pc.validity_months ? `${pc.validity_months} months` : "Until divine union"}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { key: "can_chat" as const, label: "Chat enabled", icon: MessageSquare },
                    { key: "can_send_requests" as const, label: "Send requests", icon: Sparkles },
                    { key: "can_superlike" as const, label: "Super-likes", icon: Crown },
                    { key: "can_see_who_liked" as const, label: "See who blessed", icon: ShieldCheck },
                    { key: "can_rsvp_events" as const, label: "Event RSVP", icon: CreditCard },
                    { key: "can_video_call" as const, label: "Video calls", icon: MessageSquare },
                    { key: "has_matchmaker" as const, label: "Personal matchmaker", icon: Users },
                    { key: "has_verified_badge" as const, label: "Verified badge", icon: ShieldCheck },
                    { key: "can_view_full_astro" as const, label: "Full Astro (36 pts)", icon: Sparkles },
                    { key: "priority_in_discovery" as const, label: "Priority discovery", icon: Crown },
                  ].map((feat) => (
                    <div key={feat.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <feat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{feat.label}</span>
                      </div>
                      <Switch
                        checked={pc[feat.key] as boolean}
                        onCheckedChange={(v) =>
                          setPlanConfigs((prev) =>
                            prev.map((p) => (p.id === pc.id ? { ...p, [feat.key]: v } : p))
                          )
                        }
                      />
                    </div>
                  ))}

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px]">Daily request limit</Label>
                      <Input
                        type="number"
                        value={pc.daily_request_limit}
                        onChange={(e) =>
                          setPlanConfigs((prev) =>
                            prev.map((p) => (p.id === pc.id ? { ...p, daily_request_limit: parseInt(e.target.value) || 0 } : p))
                          )
                        }
                        className="h-9 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Daily super-like limit</Label>
                      <Input
                        type="number"
                        value={pc.daily_superlike_limit}
                        onChange={(e) =>
                          setPlanConfigs((prev) =>
                            prev.map((p) => (p.id === pc.id ? { ...p, daily_superlike_limit: parseInt(e.target.value) || 0 } : p))
                          )
                        }
                        className="h-9 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "payments" && (
          <div className="space-y-6">
            <h2 className="font-serif text-xl flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Razorpay Configuration</h2>

            <div className="glass-card rounded-2xl border border-border/40 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2.5 rounded-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>These credentials are sensitive. They are stored encrypted in your database.</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Key ID</Label>
                  <Input
                    value={razorpayConfig.key_id}
                    onChange={(e) => setRazorpayConfig((p) => ({ ...p, key_id: e.target.value }))}
                    placeholder="rzp_test_..."
                    className="h-10 bg-card border-border/60 font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Key Secret</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={razorpayConfig.key_secret}
                      onChange={(e) => setRazorpayConfig((p) => ({ ...p, key_secret: e.target.value }))}
                      placeholder="••••••••"
                      className="h-10 bg-card border-border/60 font-mono text-sm pr-20"
                    />
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                    >
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Webhook Secret</Label>
                  <Input
                    value={razorpayConfig.webhook_secret}
                    onChange={(e) => setRazorpayConfig((p) => ({ ...p, webhook_secret: e.target.value }))}
                    placeholder="whsec_..."
                    className="h-10 bg-card border-border/60 font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={razorpayConfig.test_mode}
                      onCheckedChange={(v) => setRazorpayConfig((p) => ({ ...p, test_mode: v }))}
                    />
                    <Label className="text-xs">Test Mode</Label>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${razorpayConfig.test_mode ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                    {razorpayConfig.test_mode ? "TEST MODE" : "LIVE MODE"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-saffron text-primary-foreground"
                onClick={() => void saveRazorpayConfig()}
                disabled={savingRazorpay}
              >
                {savingRazorpay ? "Saving..." : "Save Configuration"}
              </Button>
            </div>

            {/* Subscription overview */}
            <h3 className="font-serif text-lg flex items-center gap-2 pt-2"><Users className="h-4 w-4 text-primary" /> Subscription Overview</h3>
            <div className="glass-card rounded-2xl border border-border/40 p-4 space-y-2">
              {["seeker", "premium", "moksha"].map((plan) => {
                const count = subs.filter((s) => s.plan === plan && s.status === "active").length;
                const label = plan === "premium" ? "Sacred" : plan === "moksha" ? "Moksha" : "Seeker (Free)";
                return (
                  <div key={plan} className="flex items-center justify-between py-1">
                    <span className="text-sm">{label}</span>
                    <span className="text-sm font-medium">{count} souls</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium">Total Revenue (est.)</span>
                <span className="text-sm font-medium">
                  ₹{subs.filter((s) => s.status === "active" && s.plan === "premium").length * 499 +
                    subs.filter((s) => s.status === "active" && s.plan === "moksha").length * 1499}
                </span>
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "messages" && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Recent Messages</h2>
            <div className="space-y-3">
              {msgs.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
              {msgs.map((m) => (
                <div key={m.id} className="glass-card rounded-2xl p-4 space-y-2 border border-border/40">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{m.id.slice(0, 16)}...</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Chat: {m.chat_id.slice(0, 12)}...</p>
                  <p className="text-sm leading-snug">{m.content}</p>
                  <Button type="button" variant="destructive" size="sm" className="h-8 text-xs" onClick={() => void removeMessage(m.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
