import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Sparkles, Heart, MessageCircle, Settings, Flag, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateCompatibility,
  fetchMatchedContactFields,
  getAllProfilesExceptMe,
  getCompatibilityWithReasons,
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
import { checkMutualMatch, hasUserLiked, likeUser, rejectIncomingRequest } from "@/lib/likes";
import { signOutUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/profile";
import { uploadProfileImage } from "@/lib/profileStorage";
import {
  callPreferences,
  childrenPreferences,
  dailyRhythmOptions,
  dietOptions,
  drinkingHabits,
  educationLevels,
  familyOrientations,
  gurus,
  incomeRanges,
  languageOptions,
  lifestyleOptions,
  maritalStatuses,
  marriageTimelines,
  meditationExperiences,
  optionLabel,
  practices as practiceOptions,
  programsUndergone,
  relocationOptions,
  religionOptions,
  sadhanaFrequencies,
  sevaInclinations,
  smokingHabits,
  spiritualPaths,
  spiritualValues,
} from "@/lib/onboardingOptions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

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
  const [isMutualMatched, setIsMutualMatched] = useState(false);
  const isOwn = !id;

  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGuru, setEditGuru] = useState("");
  const [editDiet, setEditDiet] = useState("");
  const [editLifestyle, setEditLifestyle] = useState("");
  const [editPractices, setEditPractices] = useState<string[]>([]);
  const [editSpiritualPath, setEditSpiritualPath] = useState("");
  const [editPrograms, setEditPrograms] = useState<string[]>([]);
  const [editSadhana, setEditSadhana] = useState("");
  const [editValues, setEditValues] = useState<string[]>([]);
  const [editMeditation, setEditMeditation] = useState("");
  const [editSeva, setEditSeva] = useState("");
  const [editGuruNotes, setEditGuruNotes] = useState("");
  const [editGuruPhotoUrl, setEditGuruPhotoUrl] = useState("");
  const [editMarriageTimeline, setEditMarriageTimeline] = useState("");
  const [editMaritalStatus, setEditMaritalStatus] = useState("");
  const [editChildren, setEditChildren] = useState("");
  const [editRelocation, setEditRelocation] = useState("");
  const [editFamilyOrientation, setEditFamilyOrientation] = useState("");
  const [editLanguages, setEditLanguages] = useState<string[]>([]);
  const [editSmoking, setEditSmoking] = useState("");
  const [editDrinking, setEditDrinking] = useState("");
  const [editDailyRhythm, setEditDailyRhythm] = useState("");
  const [editReligion, setEditReligion] = useState("");
  const [editCaste, setEditCaste] = useState("");
  const [editNakshatra, setEditNakshatra] = useState("");
  const [editGothram, setEditGothram] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editIncome, setEditIncome] = useState("");
  const [editHeightCm, setEditHeightCm] = useState("");
  const [editFamilyDetails, setEditFamilyDetails] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editCallPreference, setEditCallPreference] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [matchedContact, setMatchedContact] = useState<{ whatsapp: string | null; callPreference: string | null } | null>(
    null
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const guruPhotoInputRef = useRef<HTMLInputElement>(null);

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
    setEditDiet(me.diet ?? "");
    setEditLifestyle(me.lifestyle ?? "");
    setEditPractices([...me.practices]);
    setEditSpiritualPath(me.spiritual_path ?? "");
    setEditPrograms([...me.programs_undergone]);
    setEditSadhana(me.sadhana_frequency ?? "");
    setEditValues([...me.spiritual_values]);
    setEditMeditation(me.meditation_experience ?? "");
    setEditSeva(me.seva_inclination ?? "");
    setEditGuruNotes(me.guru_notes ?? "");
    setEditGuruPhotoUrl(me.guru_photo_url ?? "");
    setEditMarriageTimeline(me.marriage_timeline ?? "");
    setEditMaritalStatus(me.marital_status ?? "");
    setEditChildren(me.children_preference ?? "");
    setEditRelocation(me.relocation_openness ?? "");
    setEditFamilyOrientation(me.family_orientation ?? "");
    setEditLanguages([...me.languages]);
    setEditSmoking(me.smoking_habit ?? "");
    setEditDrinking(me.drinking_habit ?? "");
    setEditDailyRhythm(me.daily_rhythm ?? "");
    setEditReligion(me.religion ?? "");
    setEditCaste(me.caste ?? "");
    setEditNakshatra(me.nakshatra ?? "");
    setEditGothram(me.gothram ?? "");
    setEditOccupation(me.occupation ?? "");
    setEditEducation(me.education ?? "");
    setEditIncome(me.income_range ?? "");
    setEditHeightCm(me.height_cm != null ? String(me.height_cm) : "");
    setEditFamilyDetails(me.family_details ?? "");
    setEditWhatsapp(me.whatsapp_number ?? "");
    setEditCallPreference(me.call_preference ?? "");
  }, [me, isOwn]);

  const galleryProfiles = useMemo(() => others.slice(0, 3), [others]);
  const otherProfile = useMemo(() => (id ? others.find((x) => x.id === id) ?? null : null), [id, others]);

  const profile = useMemo(() => {
    if (isOwn) {
      return null;
    }

    if (!otherProfile) {
      return null;
    }

    const compatibility = me ? calculateCompatibility(me, otherProfile) : otherProfile.compatibility;
    const matchReasons =
      me && otherProfile.match_reasons?.length
        ? otherProfile.match_reasons
        : me
          ? getCompatibilityWithReasons(me, otherProfile).reasons
          : [];
    return {
      id: otherProfile.id,
      name: getDisplayName(otherProfile),
      age: getProfileAge(otherProfile),
      location: getProfileCity(otherProfile),
      photo: getProfilePhotoUrl(otherProfile),
      compatibility,
      guru: guruDisplayName(otherProfile.guru),
      practice: practiceLabel(getPrimaryPractice(otherProfile.practices)),
      diet: optionLabel(dietOptions, otherProfile.diet),
      lifestyle: optionLabel(lifestyleOptions, otherProfile.lifestyle),
      bio: otherProfile.bio ?? "Walking the path of bhakti, breath, and being.",
      practices: otherProfile.practices.length ? otherProfile.practices : ["Daily Sadhana"],
      guruId: otherProfile.guru,
      matchReasons,
      verified: otherProfile.verification_status === "verified",
    };
  }, [isOwn, me, otherProfile]);

  useEffect(() => {
    const loadRequestState = async () => {
      if (!me?.id || !id) {
        setIsReceivedRequest(false);
        setIsMutualMatched(false);
        return;
      }

      const [mutual, theyLikedMe, iLikedThem] = await Promise.all([
        checkMutualMatch(me.id, id),
        hasUserLiked(id, me.id),
        hasUserLiked(me.id, id),
      ]);

      setIsMutualMatched(mutual);
      setIsReceivedRequest(Boolean(!mutual && theyLikedMe && !iLikedThem));
    };

    void loadRequestState();
  }, [id, me?.id]);

  useEffect(() => {
    if (!isMutualMatched || !me?.id || !id) {
      setMatchedContact(null);
      return;
    }
    let cancelled = false;
    void fetchMatchedContactFields(id).then((c) => {
      if (!cancelled) {
        setMatchedContact(c);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isMutualMatched, me?.id, id]);

  const togglePractice = (practiceId: string) => {
    setEditPractices((prev) =>
      prev.includes(practiceId) ? prev.filter((x) => x !== practiceId) : [...prev, practiceId]
    );
  };

  const toggleInList = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const selectClass =
    "flex h-10 w-full rounded-md border border-border/60 bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

  const handleGuruPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

    const saved = await updateUserProfile(me.id, { guru_photo_url: uploaded.publicUrl });
    if (!saved.ok) {
      toast.error(saved.error ?? "Could not save guru image.");
      return;
    }

    setEditGuruPhotoUrl(uploaded.publicUrl);
    setMe((prev) => (prev ? { ...prev, guru_photo_url: uploaded.publicUrl } : null));
    toast.success("Guru image saved.");
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

    let height_cm: number | null = null;
    const ht = editHeightCm.trim();
    if (ht !== "") {
      const hn = Number.parseInt(ht, 10);
      if (Number.isNaN(hn) || hn < 100 || hn > 250) {
        toast.error("Height: enter centimeters between 100 and 250, or leave blank.");
        setSavingProfile(false);
        return;
      }
      height_cm = hn;
    }

    const result = await updateUserProfile(me.id, {
      full_name: editName.trim() || null,
      age,
      city: editCity.trim() || null,
      bio: editBio.trim() || null,
      guru: editGuru || null,
      diet: editDiet || null,
      lifestyle: editLifestyle || null,
      practices: editPractices,
      spiritual_path: editSpiritualPath || null,
      programs_undergone: editPrograms,
      sadhana_frequency: editSadhana || null,
      spiritual_values: editValues,
      meditation_experience: editMeditation || null,
      seva_inclination: editSeva || null,
      guru_notes: editGuruNotes.trim() || null,
      guru_photo_url: editGuruPhotoUrl.trim() || null,
      marriage_timeline: editMarriageTimeline || null,
      marital_status: editMaritalStatus || null,
      children_preference: editChildren || null,
      relocation_openness: editRelocation || null,
      family_orientation: editFamilyOrientation || null,
      languages: editLanguages,
      smoking_habit: editSmoking || null,
      drinking_habit: editDrinking || null,
      daily_rhythm: editDailyRhythm || null,
      religion: editReligion || null,
      caste: editCaste.trim() || null,
      nakshatra: editNakshatra.trim() || null,
      gothram: editGothram.trim() || null,
      occupation: editOccupation.trim() || null,
      education: editEducation || null,
      income_range: editIncome || null,
      height_cm,
      family_details: editFamilyDetails.trim() || null,
      whatsapp_number: editWhatsapp.trim() || null,
      call_preference: editCallPreference || null,
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

    const { chatId, error: chatErr } = await createOrGetChat(me.id, id);
    if (!chatId) {
      toast.error(chatErr ?? "Matched, but chat could not be opened.");
      return;
    }

    setIsMutualMatched(true);
    toast.success("It's a match! Chat unlocked.");
    nav(`/app/chat/${chatId}`);
  };

  const handleOpenChat = async () => {
    if (!me?.id || !id) {
      return;
    }

    const { chatId, error: chatErr } = await createOrGetChat(me.id, id);
    if (!chatId) {
      toast.error(chatErr ?? "Could not open chat.");
      return;
    }

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
      nav("/app/matches#soul-invitations-received", { replace: true });
      return;
    }
    toast.success("Bless sent.");
  };

  const handleReport = async () => {
    if (!me?.id || !id) {
      return;
    }
    const { data: existing, error: existingErr } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", me.id)
      .eq("reported_id", id)
      .maybeSingle();
    if (existingErr) {
      toast.error(existingErr.message ?? "Could not verify report status.");
      return;
    }
    if (existing) {
      toast.error("You have already reported this user.");
      return;
    }
    const { error } = await supabase.from("reports").insert({
      reporter_id: me.id,
      reported_id: id,
      reason: "Inappropriate behaviour",
      status: "pending",
    });
    if (error) {
      toast.error(error.message ?? "Could not report user.");
      return;
    }
    toast.success("Report submitted. We'll review it.");
    nav("/app/matches", { replace: true });
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
  const ownGuruMeta = editGuru ? gurus.find((g) => g.id === editGuru) : undefined;
  const ownGuruPortrait = editGuruPhotoUrl.trim() || ownGuruMeta?.imageUrl?.trim() || "";

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
          <input
            ref={guruPhotoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void handleGuruPhotoChange(e)}
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

              <Accordion type="multiple" defaultValue={["essence"]} className="w-full space-y-2 pt-1">
                <AccordionItem value="essence" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Spiritual Essence</AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-3">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Guru</p>
                      <select value={editGuru} onChange={(e) => setEditGuru(e.target.value)} className={selectClass}>
                        <option value="">Choose guru</option>
                        {gurus.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {ownGuruMeta ? (
                      <div className="flex gap-3 items-start rounded-xl border border-border/40 bg-background/40 p-3">
                        {ownGuruPortrait ? (
                          <img
                            src={ownGuruPortrait}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover shrink-0 border border-border/50"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-primary/10 border border-border/50 shrink-0 grid place-items-center text-sm text-primary font-serif">
                            ॐ
                          </div>
                        )}
                        <div className="min-w-0 text-xs space-y-1">
                          <p className="font-medium text-foreground">{ownGuruMeta.name}</p>
                          <p className="text-muted-foreground">{ownGuruMeta.tradition}</p>
                          {ownGuruMeta.lineage ? <p className="text-foreground/80 leading-snug">{ownGuruMeta.lineage}</p> : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 border-border/60 text-xs"
                        onClick={() => guruPhotoInputRef.current?.click()}
                      >
                        Guru image
                      </Button>
                      <p className="text-[11px] text-muted-foreground w-full leading-relaxed">
                        Optional portrait for your lineage. Catalog gurus may include a suggested image.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guru-notes" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Guru / lineage notes
                      </Label>
                      <Textarea
                        id="guru-notes"
                        value={editGuruNotes}
                        onChange={(e) => setEditGuruNotes(e.target.value)}
                        placeholder="A few words about your connection to the Guru or lineage"
                        className="min-h-[72px] bg-card border-border/60 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Spiritual path</p>
                      <select
                        value={editSpiritualPath}
                        onChange={(e) => setEditSpiritualPath(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Choose path</option>
                        {spiritualPaths.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Daily practices</p>
                      <div className="flex flex-wrap gap-2">
                        {practiceOptions.map((p) => {
                          const sel = editPractices.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePractice(p.id)}
                              className={cn(
                                "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                              )}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Programs undergone</p>
                      <div className="flex flex-wrap gap-2">
                        {programsUndergone.map((p) => {
                          const sel = editPrograms.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleInList(p.id, editPrograms, setEditPrograms)}
                              className={cn(
                                "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                              )}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Sadhana frequency</p>
                      <select value={editSadhana} onChange={(e) => setEditSadhana(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {sadhanaFrequencies.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Spiritual values</p>
                      <div className="flex flex-wrap gap-2">
                        {spiritualValues.map((v) => {
                          const sel = editValues.includes(v.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => toggleInList(v.id, editValues, setEditValues)}
                              className={cn(
                                "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                              )}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Meditation depth</p>
                        <select value={editMeditation} onChange={(e) => setEditMeditation(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {meditationExperiences.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Seva inclination</p>
                        <select value={editSeva} onChange={(e) => setEditSeva(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {sevaInclinations.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="relationship" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Relationship Intention</AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Marriage timeline</p>
                        <select
                          value={editMarriageTimeline}
                          onChange={(e) => setEditMarriageTimeline(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {marriageTimelines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Marital status</p>
                        <select
                          value={editMaritalStatus}
                          onChange={(e) => setEditMaritalStatus(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {maritalStatuses.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Children</p>
                        <select value={editChildren} onChange={(e) => setEditChildren(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {childrenPreferences.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Relocation</p>
                        <select value={editRelocation} onChange={(e) => setEditRelocation(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {relocationOptions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Family orientation</p>
                        <select
                          value={editFamilyOrientation}
                          onChange={(e) => setEditFamilyOrientation(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">—</option>
                          {familyOrientations.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lifestyle" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Lifestyle</AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Diet</p>
                        <select value={editDiet} onChange={(e) => setEditDiet(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {dietOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Daily rhythm</p>
                        <select value={editDailyRhythm} onChange={(e) => setEditDailyRhythm(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {dailyRhythmOptions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Householder rhythm</p>
                        <select value={editLifestyle} onChange={(e) => setEditLifestyle(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {lifestyleOptions.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Smoking</p>
                        <select value={editSmoking} onChange={(e) => setEditSmoking(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {smokingHabits.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Drinking</p>
                        <select value={editDrinking} onChange={(e) => setEditDrinking(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {drinkingHabits.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {languageOptions.map((lang) => {
                          const sel = editLanguages.includes(lang.id);
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => toggleInList(lang.id, editLanguages, setEditLanguages)}
                              className={cn(
                                "px-3 py-2 rounded-full border text-xs font-medium transition-all",
                                sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"
                              )}
                            >
                              {lang.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="traditional" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline text-muted-foreground">
                    Traditional details <span className="text-[10px] font-normal normal-case">(optional)</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Religion</p>
                      <select value={editReligion} onChange={(e) => setEditReligion(e.target.value)} className={selectClass}>
                        <option value="">—</option>
                        {religionOptions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="caste" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Caste
                        </Label>
                        <Input
                          id="caste"
                          value={editCaste}
                          onChange={(e) => setEditCaste(e.target.value)}
                          className="h-10 bg-card border-border/60 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nakshatra" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Nakshatra
                        </Label>
                        <Input
                          id="nakshatra"
                          value={editNakshatra}
                          onChange={(e) => setEditNakshatra(e.target.value)}
                          className="h-10 bg-card border-border/60 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gothram" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Gothram
                        </Label>
                        <Input
                          id="gothram"
                          value={editGothram}
                          onChange={(e) => setEditGothram(e.target.value)}
                          className="h-10 bg-card border-border/60 text-sm"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="earthly" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline text-muted-foreground">
                    Earthly identity <span className="text-[10px] font-normal normal-case">(optional)</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Occupation
                      </Label>
                      <Input
                        id="occupation"
                        value={editOccupation}
                        onChange={(e) => setEditOccupation(e.target.value)}
                        className="h-10 bg-card border-border/60 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Education</p>
                        <select value={editEducation} onChange={(e) => setEditEducation(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {educationLevels.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Income</p>
                        <select value={editIncome} onChange={(e) => setEditIncome(e.target.value)} className={selectClass}>
                          <option value="">—</option>
                          {incomeRanges.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Height (cm)
                        </Label>
                        <Input
                          id="height"
                          inputMode="numeric"
                          value={editHeightCm}
                          onChange={(e) => setEditHeightCm(e.target.value)}
                          placeholder="e.g. 168"
                          className="h-10 bg-card border-border/60 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="family-details" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Family details
                      </Label>
                      <Textarea
                        id="family-details"
                        value={editFamilyDetails}
                        onChange={(e) => setEditFamilyDetails(e.target.value)}
                        className="min-h-[72px] bg-card border-border/60 text-sm"
                        placeholder="Brief, as you feel called to share"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Sacred contact</AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      WhatsApp and call preference are stored privately. They appear only after a mutual Sacred Connection.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="wa" className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        WhatsApp (with country code)
                      </Label>
                      <Input
                        id="wa"
                        inputMode="tel"
                        autoComplete="tel"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        placeholder="+91 …"
                        className="h-10 bg-card border-border/60 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Call preference</p>
                      <select
                        value={editCallPreference}
                        onChange={(e) => setEditCallPreference(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">—</option>
                        {callPreferences.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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

      {!isOwn && profile && otherProfile && (
        <>
          <div className="relative aspect-[4/5]">
            <img src={profile.photo} alt={profile.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/20" />
            <Link to="/app/matches" className="absolute top-6 left-5 h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button
              onClick={() => void handleReport()}
              className="absolute top-6 right-5 h-10 w-10 rounded-full bg-background/80 backdrop-blur grid place-items-center"
              title="Report user"
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>

          <div className="-mt-20 relative px-5">
            <div className="glass-card rounded-3xl p-6 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-serif text-3xl leading-none">
                      {profile.name}, {profile.age}
                    </h1>
                    {profile.verified ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {profile.location}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1 shrink-0">
                  <Sparkles className="h-3 w-3" /> {profile.compatibility}%
                </span>
              </div>

              {profile.matchReasons?.length ? (
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground border border-border/40 rounded-xl px-3 py-2.5 bg-card/30">
                  {profile.matchReasons.slice(0, 5).map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <span className="text-primary shrink-0">·</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="font-serif italic text-lg mt-4 leading-snug text-foreground/90">"{profile.bio}"</p>

              {(() => {
                const gm = otherProfile.guru ? gurus.find((g) => g.id === otherProfile.guru) : undefined;
                const portrait = otherProfile.guru_photo_url?.trim() || gm?.imageUrl?.trim() || "";
                return gm || portrait ? (
                  <div className="mt-5 flex gap-3 items-start rounded-xl border border-border/40 bg-card/30 p-3">
                    {portrait ? (
                      <img src={portrait} alt="" className="h-14 w-14 rounded-full object-cover shrink-0 border border-border/50" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 border border-border/50 shrink-0 grid place-items-center text-sm text-primary font-serif">
                        ॐ
                      </div>
                    )}
                    <div className="min-w-0 text-sm space-y-0.5">
                      <p className="font-medium">{profile.guru}</p>
                      {gm?.tradition ? <p className="text-xs text-muted-foreground">{gm.tradition}</p> : null}
                      {gm?.lineage ? <p className="text-xs text-foreground/80 leading-snug">{gm.lineage}</p> : null}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Field label="Path" value={optionLabel(spiritualPaths, otherProfile.spiritual_path)} />
                <Field label="Primary practice" value={profile.practice} />
                <Field label="Diet" value={profile.diet} />
                <Field label="Lifestyle" value={profile.lifestyle} />
              </div>

              <Accordion type="multiple" className="w-full space-y-2 mt-5">
                <AccordionItem value="o-essence" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Spiritual Essence</AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3 text-sm">
                    {otherProfile.guru_notes?.trim() ? <Field label="Lineage notes" value={otherProfile.guru_notes.trim()} /> : null}
                    <Field label="Sadhana" value={optionLabel(sadhanaFrequencies, otherProfile.sadhana_frequency)} />
                    <Field label="Meditation" value={optionLabel(meditationExperiences, otherProfile.meditation_experience)} />
                    <Field label="Seva" value={optionLabel(sevaInclinations, otherProfile.seva_inclination)} />
                    {otherProfile.programs_undergone.length ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Programs</p>
                        <p className="font-medium mt-0.5">
                          {otherProfile.programs_undergone.map((x) => optionLabel(programsUndergone, x)).join(" · ")}
                        </p>
                      </div>
                    ) : null}
                    {otherProfile.spiritual_values.length ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Values</p>
                        <p className="font-medium mt-0.5">
                          {otherProfile.spiritual_values.map((x) => optionLabel(spiritualValues, x)).join(" · ")}
                        </p>
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="o-rel" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Relationship Intention</AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3 text-sm">
                    <Field label="Marriage timeline" value={optionLabel(marriageTimelines, otherProfile.marriage_timeline)} />
                    <Field label="Marital status" value={optionLabel(maritalStatuses, otherProfile.marital_status)} />
                    <Field label="Children" value={optionLabel(childrenPreferences, otherProfile.children_preference)} />
                    <Field label="Relocation" value={optionLabel(relocationOptions, otherProfile.relocation_openness)} />
                    <Field label="Family" value={optionLabel(familyOrientations, otherProfile.family_orientation)} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="o-life" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline">Lifestyle</AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3 text-sm">
                    <Field label="Daily rhythm" value={optionLabel(dailyRhythmOptions, otherProfile.daily_rhythm)} />
                    <Field label="Smoking" value={optionLabel(smokingHabits, otherProfile.smoking_habit)} />
                    <Field label="Drinking" value={optionLabel(drinkingHabits, otherProfile.drinking_habit)} />
                    {otherProfile.languages.length ? (
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Languages</p>
                        <p className="font-medium mt-0.5">
                          {otherProfile.languages.map((x) => optionLabel(languageOptions, x)).join(" · ")}
                        </p>
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="o-trad" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline text-muted-foreground">
                    Traditional <span className="text-[10px] font-normal normal-case">(optional)</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3 text-sm">
                    <Field label="Religion" value={optionLabel(religionOptions, otherProfile.religion)} />
                    <Field label="Caste" value={otherProfile.caste?.trim() || "—"} />
                    <Field label="Nakshatra" value={otherProfile.nakshatra?.trim() || "—"} />
                    <Field label="Gothram" value={otherProfile.gothram?.trim() || "—"} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="o-earth" className="border border-border/50 rounded-2xl px-3 bg-card/25">
                  <AccordionTrigger className="text-sm py-3 hover:no-underline text-muted-foreground">
                    Earthly identity <span className="text-[10px] font-normal normal-case">(optional)</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3 text-sm">
                    <Field label="Occupation" value={otherProfile.occupation?.trim() || "—"} />
                    <Field label="Education" value={optionLabel(educationLevels, otherProfile.education)} />
                    <Field label="Income" value={optionLabel(incomeRanges, otherProfile.income_range)} />
                    <Field
                      label="Height"
                      value={otherProfile.height_cm != null ? `${otherProfile.height_cm} cm` : "—"}
                    />
                    <Field label="Family details" value={otherProfile.family_details?.trim() || "—"} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Daily practices</p>
                <div className="flex flex-wrap gap-2">
                  {profile.practices.map((p: string) => (
                    <span key={p} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                      {practiceLabel(p)}
                    </span>
                  ))}
                </div>
              </div>

              {isMutualMatched && matchedContact && (matchedContact.whatsapp || matchedContact.callPreference) ? (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2 text-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium">Sacred connection</p>
                  {matchedContact.whatsapp ? (
                    <p>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">WhatsApp</span>
                      <br />
                      <a href={`https://wa.me/${matchedContact.whatsapp.replace(/\D/g, "")}`} className="font-medium break-all">
                        {matchedContact.whatsapp}
                      </a>
                    </p>
                  ) : null}
                  {matchedContact.callPreference ? (
                    <Field label="Call preference" value={optionLabel(callPreferences, matchedContact.callPreference)} />
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-3 gap-2">
                {galleryProfiles.map((p) => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={getProfilePhotoUrl(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {isMutualMatched ? (
              <Button onClick={() => void handleOpenChat()} className="mt-6 w-full h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
                <MessageCircle className="h-4 w-4 mr-2" /> Open Chat
              </Button>
            ) : isReceivedRequest ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button onClick={() => void handleReject()} variant="outline" className="h-12 border-border/60 bg-card">
                  Reject
                </Button>
                <Button onClick={() => void handleConnect()} className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
                  Accept
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button onClick={() => void handleReject()} variant="outline" className="h-12 border-border/60 bg-card">
                  <Heart className="h-4 w-4 mr-2 text-primary" /> Bless
                </Button>
                <Button onClick={() => void handleConnect()} className="h-12 bg-gradient-saffron text-primary-foreground shadow-warm">
                  <MessageCircle className="h-4 w-4 mr-2" /> Connect
                </Button>
              </div>
            )}
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
