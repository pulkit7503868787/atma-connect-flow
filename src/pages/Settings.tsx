import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import {
  LogOut,
  Crown,
  Heart,
  Shield,
  Phone,
  Video,
  EyeOff,
  Trash2,
  Ban,
  Bell,
  HelpCircle,
  MessageCircleQuestion,
  KeyRound,
  ChevronRight,
  Moon,
  UserX,
  Sparkles,
  Lock,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { signOutUser, changePassword } from "@/lib/auth";
import { getCurrentUserProfile, type UserProfile } from "@/lib/db";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

/* ─── Types ─── */
type UserSettings = {
  allow_phone_share: boolean;
  allow_video_call: boolean;
  profile_visible: boolean;
  notifications_matches: boolean;
  notifications_messages: boolean;
  notifications_events: boolean;
  notifications_marketing: boolean;
};

type BlockedUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const defaultSettings: UserSettings = {
  allow_phone_share: false,
  allow_video_call: false,
  profile_visible: true,
  notifications_matches: true,
  notifications_messages: true,
  notifications_events: true,
  notifications_marketing: false,
};

const faqItems = [
  {
    q: "How does AatmamIlan match souls?",
    a: "Our sacred algorithm considers your guru lineage, daily practices, spiritual path, lifestyle choices, and traditional compatibility markers like nakshatra. The more complete your profile, the deeper the resonance.",
  },
  {
    q: "What is Astro Matching?",
    a: "Astro Matching (Guna Milan) analyzes 36 compatibility points across 8 categories including Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi. Available in Sacred and Moksha plans.",
  },
  {
    q: "Can I hide my profile temporarily?",
    a: "Yes, in Privacy settings you can hide your profile from discovery. Your existing matches and chats remain untouched. You can reappear anytime.",
  },
  {
    q: "How are my contact details protected?",
    a: "Your phone number is only shared after mutual match and only if you enable it in settings. We never share your email or exact location.",
  },
  {
    q: "What happens when I delete my account?",
    a: "All your data including profile, chats, matches, and posts are permanently removed within 30 days. This action cannot be undone.",
  },
  {
    q: "How do I report inappropriate behaviour?",
    a: "Tap the flag icon on any user's profile to report. Our moderation team reviews within 24 hours. You can also block users from this Settings page.",
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [savingSetting, setSavingSetting] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [subscription, setSubscription] = useState<{ plan: string; status: string; valid_until?: string } | null>(null);

  /* Password change */
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  /* Delete account */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  /* Hide profile */
  const [hideDialogOpen, setHideDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      setMe(profile);

      if (profile) {
        /* Load subscription */
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan,status,valid_until")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .maybeSingle();
        if (sub) setSubscription(sub);

        /* Load settings */
        const { data: st } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle();
        if (st) {
          setSettings({
            allow_phone_share: st.allow_phone_share ?? false,
            allow_video_call: st.allow_video_call ?? false,
            profile_visible: st.profile_visible ?? true,
            notifications_matches: st.notifications_matches ?? true,
            notifications_messages: st.notifications_messages ?? true,
            notifications_events: st.notifications_events ?? true,
            notifications_marketing: st.notifications_marketing ?? false,
          });
        }

        /* Load blocked users */
        const { data: blocks } = await supabase
          .from("blocked_users")
          .select("blocked_user_id")
          .eq("user_id", profile.id);
        if (blocks?.length) {
          const ids = blocks.map((b) => b.blocked_user_id);
          const { data: users } = await supabase
            .from("users")
            .select("id,full_name,avatar_url")
            .in("id", ids);
          setBlockedUsers(users ?? []);
        }
      }
      setLoading(false);
    };
    void load();
  }, []);

  const updateSetting = async (key: keyof UserSettings, value: boolean) => {
    if (!me?.id) return;
    setSavingSetting(key);
    setSettings((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: me.id, [key]: value }, { onConflict: "user_id" });
    setSavingSetting(null);
    if (error) {
      toast.error(error.message);
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const handleUnblock = async (userId: string) => {
    if (!me?.id) return;
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("user_id", me.id)
      .eq("blocked_user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("Unblocked. They can now see and connect with you.");
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setChangingPwd(true);
    const result = await changePassword(newPwd);
    setChangingPwd(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated.");
    setPwdDialogOpen(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const handleHideProfile = async (hide: boolean) => {
    if (!me?.id) return;
    const { error } = await supabase.from("users").update({ profile_hidden: hide }).eq("id", me.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    updateSetting("profile_visible", !hide);
    toast.success(hide ? "Profile hidden from discovery." : "Profile is now visible.");
    setHideDialogOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    if (!me?.id) return;
    setDeleting(true);
    /* Soft delete - mark for deletion */
    const { error } = await supabase.from("users").update({ is_blocked: true, deletion_requested: true }).eq("id", me.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account deletion requested. Your data will be removed within 30 days.");
    setDeleteDialogOpen(false);
    /* Sign out */
    await signOutUser();
    navigate("/auth", { replace: true });
  };

  const handleLogout = async () => {
    const result = await signOutUser();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Signed out. May your path be blessed.");
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Settings" subtitle="Your sacred preferences" back />
        <p className="px-5 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const planLabel = subscription?.plan === "premium" ? "Sacred" : subscription?.plan === "moksha" ? "Moksha" : "Seeker (Free)";
  const isPremium = subscription?.plan === "premium" || subscription?.plan === "moksha";

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Settings" subtitle="Your sacred preferences" back />

      <div className="px-5 space-y-6">
        {/* ── Membership Card ── */}
        <section className="glass-card rounded-2xl p-5 bg-gradient-saffron/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-saffron grid place-items-center shadow-warm">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-serif text-lg">{planLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {subscription?.status === "active"
                    ? subscription?.valid_until
                      ? `Valid until ${new Date(subscription.valid_until).toLocaleDateString()}`
                      : "Active on the path"
                    : "Free seeker journey"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/app/subscription")}
              className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              {isPremium ? "Renew" : "Upgrade"}
            </button>
          </div>
        </section>

        {/* ── Partner Preferences ── */}
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Heart className="h-3.5 w-3.5" /> Partner Preference
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            <button
              onClick={() => navigate("/app/profile")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Edit Spiritual Profile</p>
                  <p className="text-[11px] text-muted-foreground">Guru, practices, path, lifestyle</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => toast("Partner preferences will be available in the next update.")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Partner Preferences</p>
                  <p className="text-[11px] text-muted-foreground">Age, path, diet, lifestyle filters</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* ── Privacy & Controls ── */}
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Privacy & Controls
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Share Phone Number</p>
                  <p className="text-[11px] text-muted-foreground">Allow matched souls to see your WhatsApp</p>
                </div>
              </div>
              <Switch
                checked={settings.allow_phone_share}
                onCheckedChange={(v) => updateSetting("allow_phone_share", v)}
                disabled={savingSetting === "allow_phone_share"}
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Video className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Video Calls</p>
                  <p className="text-[11px] text-muted-foreground">Allow video calls with matches</p>
                </div>
              </div>
              <Switch
                checked={settings.allow_video_call}
                onCheckedChange={(v) => updateSetting("allow_video_call", v)}
                disabled={savingSetting === "allow_video_call"}
              />
            </div>

            <button
              onClick={() => setHideDialogOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <EyeOff className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{settings.profile_visible ? "Hide Profile" : "Show Profile"}</p>
                  <p className="text-[11px] text-muted-foreground">{settings.profile_visible ? "Disappear from discovery" : "You are hidden — tap to reappear"}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => setPwdDialogOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-[11px] text-muted-foreground">Update your sacred key</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-destructive/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-[11px] text-muted-foreground">Permanently remove your presence</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </section>

        {/* ── Blocked Users ── */}
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Ban className="h-3.5 w-3.5" /> Blocked Souls
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden">
            {blockedUsers.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No souls blocked. Your sangha is peaceful.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {blockedUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url || "/placeholder.svg"}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                      <p className="text-sm font-medium">{u.full_name || "Unknown Soul"}</p>
                    </div>
                    <button
                      onClick={() => void handleUnblock(u.id)}
                      className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Notifications ── */}
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <Bell className="h-3.5 w-3.5" /> Notification Preferences
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {[
              { key: "notifications_matches" as const, label: "Matches & Blessings", desc: "When someone connects with you" },
              { key: "notifications_messages" as const, label: "Messages", desc: "New chat from a kindred soul" },
              { key: "notifications_events" as const, label: "Gatherings", desc: "Satsangs, retreats, and pilgrimages" },
              { key: "notifications_marketing" as const, label: "Sacred Updates", desc: "Wisdom, tips, and platform news" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={(v) => updateSetting(item.key, v)}
                  disabled={savingSetting === item.key}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Help & Support ── */}
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5" /> Help & Support
          </h3>
          <div className="glass-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-4">
                  <AccordionTrigger className="text-sm py-4 hover:no-underline">
                    <span className="flex items-center gap-2 text-left">
                      <MessageCircleQuestion className="h-4 w-4 text-primary shrink-0" />
                      {faq.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 pl-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Moon className="h-3 w-3" />
            <span>Need personal guidance? Write to us at support@aatmamilan.com</span>
          </div>
        </section>

        {/* ── Logout ── */}
        <section className="pt-4">
          <Button
            onClick={() => handleLogout()}
            variant="outline"
            className="w-full h-12 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </section>

        <p className="text-center text-[11px] text-muted-foreground/60 pb-4">
          AatmamIlan — Where souls meet their reflection
        </p>
      </div>

      {/* ── Password Change Dialog ── */}
      <Dialog open={pwdDialogOpen} onOpenChange={setPwdDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> Change Sacred Key
            </DialogTitle>
            <DialogDescription>Update your password to keep your account secure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Minimum 6 characters" className="bg-background border-border/60" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter password" className="bg-background border-border/60" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleChangePassword()} disabled={changingPwd || !newPwd || !confirmPwd} className="bg-gradient-saffron text-primary-foreground">
              {changingPwd ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Hide Profile Dialog ── */}
      <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" /> {settings.profile_visible ? "Hide Profile" : "Show Profile"}
            </DialogTitle>
            <DialogDescription>
              {settings.profile_visible
                ? "Your profile will be hidden from discovery. Existing matches and chats remain."
                : "Your profile will become visible to seekers again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleHideProfile(settings.profile_visible)} className="bg-gradient-saffron text-primary-foreground">
              {settings.profile_visible ? "Hide" : "Show"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Account Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              This will permanently remove your profile, matches, chats, and posts. Type DELETE to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-background border-border/60"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteAccount()}
              disabled={deleting || deleteConfirmText !== "DELETE"}
            >
              {deleting ? "Deleting..." : "Delete Forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
