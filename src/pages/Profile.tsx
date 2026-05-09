import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Sparkles, Heart, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateCompatibility,
  getAllProfilesExceptMe,
  getCurrentUserProfile,
  getDisplayName,
  getPrimaryPractice,
  getProfileAge,
  getProfileCity,
  getProfilePhotoUrl,
  type UserProfile,
  type UserProfileWithCompatibility,
} from "@/lib/db";
import { createOrGetChat } from "@/lib/chat";
import { useNavigate } from "react-router-dom";
import { hasUserLiked, likeUser, rejectIncomingRequest } from "@/lib/likes";
import { signOutUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/profile";
import { uploadProfileImage } from "@/lib/profileStorage";
import { gurus, practices as practiceOptions } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const practiceLabel = (id: string) => practiceOptions.find((p) => p.id === id)?.label ?? id;

const guruDisplayName = (guruId: string | null) => {
  if (!guruId) {
    return "Spiritual path";
  }
  return gurus.find((g) => g.id === guruId)?.name ?? guruId;
};

const Profile = () => {
  const nav = useNavigate();
  const { id } = useParams();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [others, setOthers] = useState<UserProfileWithCompatibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReceivedRequest, setIsReceivedRequest] = useState(false);
  const isOwn = !id;

  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGuru, setEditGuru] = useState("");
  const [editPractices, setEditPractices] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);
      const [myProfile, otherProfiles] = await Promise.all([getCurrentUserProfile(), getAllProfilesExceptMe()]);
      setMe(myProfile);
      setOthers(otherProfiles);
      setLoading(false);
    };

    void loadProfileData();
  }, []);

  useEffect(() => {
    if (!me || !isOwn) {
      return;
    }
    setEditName(me.full_name ?? "");
    setEditAge(me.age != null ? String(me.age) : "");
    setEditCity(me.city ?? "");
    setEditBio(me.bio ?? "");
    setEditGuru(me.guru ?? "");
    setEditPractices([...me.practices]);
  }, [me, isOwn]);

  const galleryProfiles = useMemo(() => others.slice(0, 3), [others]);
  const otherProfile = useMemo(() => others.find((x) => x.id === id) ?? others[0] ?? null, [id, others]);

  const profile = useMemo(() => {
    if (isOwn) {
      return null;
    }

    if (!otherProfile) {
      return null;
    }

    const compatibility = me ? calculateCompatibility(me, otherProfile) : otherProfile.compatibility;
    return {
      id: otherProfile.id,
      name: getDisplayName(otherProfile),
      age: getProfileAge(otherProfile),
      location: getProfileCity(otherProfile),
      photo: getProfilePhotoUrl(otherProfile),
      compatibility,
      guru: guruDisplayName(otherProfile.guru),
      practice: practiceLabel(getPrimaryPractice(otherProfile.practices)),
      bio: otherProfile.bio ?? "Walking the path of bhakti, breath, and being.",
      practices: otherProfile.practices.length ? otherProfile.practices : ["Daily Sadhana"],
      guruId: otherProfile.guru,
    };
  }, [isOwn, me, otherProfile]);

  useEffect(() => {
    const loadRequestState = async () => {
      if (!me?.id || !id) {
        setIsReceivedRequest(false);
        return;
      }

      const [theyLikedMe, iLikedThem] = await Promise.all([
        hasUserLiked(id, me.id),
        hasUserLiked(me.id, id),
      ]);

      setIsReceivedRequest(theyLikedMe && !iLikedThem);
    };

    void loadRequestState();
  }, [id, me?.id]);

  const togglePractice = (practiceId: string) => {
    setEditPractices((prev) =>
      prev.includes(practiceId) ? prev.filter((x) => x !== practiceId) : [...prev, practiceId]
    );
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !me?.id) {
      return;
    }

    const uploaded = await uploadProfileImage(me.id, file);
    if (uploaded.error || !uploaded.publicUrl) {
      toast.error(uploaded.error ?? "Could not upload image.");
      return;
    }

    const saved = await updateUserProfile(me.id, { avatar_url: uploaded.publicUrl });
    if (!saved.ok) {
      toast.error(saved.error ?? "Could not save photo.");
      return;
    }

    setMe((prev) => (prev ? { ...prev, avatar_url: uploaded.publicUrl } : null));
    toast.success("Photo uploaded.");
  };

  const handleSaveProfile = async () => {
    if (!me?.id) {
      return;
    }

    setSavingProfile(true);
    const trimmedAge = editAge.trim();
    let age: number | null = null;
    if (trimmedAge !== "") {
      const n = Number.parseInt(trimmedAge, 10);
      if (Number.isNaN(n) || n < 13 || n > 120) {
        toast.error("Enter a valid age (13–120) or leave blank.");
        setSavingProfile(false);
        return;
      }
      age = n;
    }

    const result = await updateUserProfile(me.id, {
      full_name: editName.trim() || null,
      age,
      city: editCity.trim() || null,
      bio: editBio.trim() || null,
      guru: editGuru || null,
      practices: editPractices,
    });
    setSavingProfile(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not save profile.");
      return;
    }

    const refreshed = await getCurrentUserProfile();
    setMe(refreshed);
    toast.success("Profile saved.");
  };

  const handleConnect = async () => {
    if (!me?.id || !id) {
      return;
    }

    const likeResult = await likeUser(me.id, id);
    if (!likeResult.ok) {
      if (likeResult.reason === "limit_reached") {
        toast.error("Daily like limit reached. Upgrade to premium for unlimited likes.");
        return;
      }
      if (likeResult.reason === "blocked") {
        toast.error("This profile is unavailable.");
        return;
      }
      if (likeResult.reason === "unauthorized") {
        toast.error(likeResult.error ?? "Please sign in again.");
        return;
      }
      toast.error(likeResult.error ?? "Unable to send request right now.");
      return;
    }

    if (!likeResult.mutualMatch) {
      if (likeResult.alreadyLiked) {
        toast.success("Request already sent.");
      } else if (isReceivedRequest) {
        toast.success("Request accepted.");
      } else {
        toast.success("Request sent.");
      }
      return;
    }

    const chatId = await createOrGetChat(me.id, id);
    if (!chatId) {
      toast.error("Matched, but chat could not be opened.");
      return;
    }

    toast.success("It's a match! Chat unlocked.");
    nav(`/app/chat/${chatId}`);
  };

  const handleReject = async () => {
    if (isReceivedRequest && me?.id && id) {
      const result = await rejectIncomingRequest(me.id, id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not decline request.");
        return;
      }
      toast.success("Request ignored.");
      nav("/app/matches?view=received", { replace: true });
      return;
    }
    toast.success("Bless sent.");
  };

  const handleLogout = async () => {
    const result = await signOutUser();
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Signed out.");
    nav("/auth", { replace: true });
  };

  const ownPhotoSrc = me ? getProfilePhotoUrl(me) : "";

  return (
    <div className="animate-fade-in pb-8">
      {loading && <p className="px-5 pt-6 text-sm text-muted-foreground">Loading profile...</p>}
      {!loading && isOwn && !me && <p className="px-5 pt-6 text-sm text-muted-foreground">Profile data is unavailable.</p>}
      {!loading && !isOwn && !profile && <p className="px-5 pt-6 text-sm text-muted-foreground">Profile data is unavailable.</p>}

      {isOwn && me && (
        <>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void handleAvatarChange(e)}
          />
          <div className="relative aspect-[4/5]">
            <button
              type="button"
              aria-label="Change profile photo"
              className="absolute inset-0 z-[1] border-0 bg-transparent p-0 cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img src={ownPhotoSrc} alt={getDisplayName(me)} className="absolute inset-0 h-full w-full object-cover pointer-events-none" />
            </button>
            <div className="absolute inset-0 z-[2] bg-gradient-to-t from-background via-background/30 to-black/20 pointer-events-none" />
            <Link
              to="/app"
              className="absolute top-6 left-5 z-[3] h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="absolute top-6 right-5 z-[3] h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <div className="-mt-20 relative px-5">
            <div className="glass-card rounded-3xl p-6 shadow-card space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 bg-card border-border/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="profile-age">Age</Label>
                  <Input
                    id="profile-age"
                    inputMode="numeric"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    placeholder="Optional"
                    className="h-12 bg-card border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-city">City</Label>
                  <Input
                    id="profile-city"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Optional"
                    className="h-12 bg-card border-border/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="A few words about your path"
                  className="min-h-[100px] bg-card border-border/60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Guru</p>
                  <select
                    value={editGuru}
                    onChange={(e) => setEditGuru(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Choose guru</option>
                    {gurus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Practice" value={practiceLabel(getPrimaryPractice(editPractices))} />
                <Field label="Diet" value="Sattvic" />
                <Field label="Lifestyle" value="Ashram-stay" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Daily practices</p>
                <div className="flex flex-wrap gap-2">
                  {practiceOptions.map((p) => {
                    const sel = editPractices.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePractice(p.id)}
                        className={cn(
                          "px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                          sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {galleryProfiles.map((p) => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={getProfilePhotoUrl(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                disabled={savingProfile}
                onClick={() => void handleSaveProfile()}
                className="w-full h-12 bg-gradient-saffron text-primary-foreground shadow-warm font-medium"
              >
                Save profile
              </Button>
            </div>
          </div>
        </>
      )}

      {!isOwn && profile && (
        <>
          <div className="relative aspect-[4/5]">
            <img src={profile.photo} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/20" />
            <Link to="/app/matches" className="absolute top-6 left-5 h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="-mt-20 relative px-5">
            <div className="glass-card rounded-3xl p-6 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-serif text-3xl leading-none">
                    {profile.name}, {profile.age}
                  </h1>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-3.5 w-3.5" /> {profile.location}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {profile.compatibility}%
                </span>
              </div>

              <p className="font-serif italic text-lg mt-4 leading-snug text-foreground/90">"{profile.bio}"</p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <Field label="Guru" value={profile.guru} />
                <Field label="Practice" value={profile.practice} />
                <Field label="Diet" value="Sattvic" />
                <Field label="Lifestyle" value="Ashram-stay" />
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Daily practices</p>
                <div className="flex flex-wrap gap-2">
                  {profile.practices.map((p: string) => (
                    <span key={p} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      {practiceLabel(p)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2">
                {galleryProfiles.map((p) => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={getProfilePhotoUrl(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={() => void handleReject()} variant="outline" className="h-12 border-border/60 bg-card">
                <Heart className="h-4 w-4 mr-2 text-primary" /> Bless
              </Button>
              <Button onClick={() => void handleConnect()} className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
                <MessageCircle className="h-4 w-4 mr-2" /> Connect
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-medium mt-0.5">{value}</p>
  </div>
);

export default Profile;
