"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  ShoppingBag, FileText, Bot, Calendar, Ticket, Users, Heart,
  Upload, X, Image, Film, Music, File, CheckCircle2, RefreshCw,
  Pencil, Check, SkipForward, Sparkles, Rocket, Camera, Mic, MicOff, Share2, Zap,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Mode = "form" | "generating" | "review" | "success";

interface GeneratedBrand {
  bio: string;
  tagline: string;
  storefront_headline: string;
  email_headline: string;
  brand_color: string;
  subscription_tiers: Array<{ name: string; price: number; description: string; perks: string[] }>;
  product_ideas: Array<{ name: string; description: string; type: string; price: number; image?: string; emoji?: string }>;
  event_idea?: { title: string; description: string; type: string; price: number; image?: string; emoji?: string };
  ai_personality: string;
}

const NICHES = ["Fitness", "Beauty", "Gaming", "Music", "Finance", "Travel", "Food", "Fashion", "Tech", "Comedy", "Sports", "Education", "Lifestyle", "Art", "Podcast"];
const CONTENT_TYPES = ["Short video", "Long video", "Photos", "Podcast", "Newsletter", "Live streams", "Reels/TikTok"];
const AUDIENCE_SIZES = ["Under 1K", "1K – 10K", "10K – 100K", "100K – 1M", "1M+"];
const FEATURE_OPTIONS = [
  { id: "merch", icon: ShoppingBag, label: "Merch Store", desc: "Custom print-on-demand merch" },
  { id: "digital", icon: FileText, label: "Digital Products", desc: "PDFs, presets, courses" },
  { id: "ai_chat", icon: Bot, label: "AI Chat", desc: "AI trained on your voice" },
  { id: "calendar", icon: Calendar, label: "Bookings", desc: "1-on-1 sessions" },
  { id: "events", icon: Ticket, label: "Events", desc: "Webinars, seminars, Zoom" },
  { id: "subscriptions", icon: Users, label: "Subscriptions", desc: "Fan membership tiers" },
  { id: "tips", icon: Heart, label: "Tips", desc: "Support button" },
];
const STEP_LABELS = ["Profile", "About", "Audience", "Brand", "Features", "Assets"];

const ACCEPTED_TYPES = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.psd,.ai,.fig,.sketch";

const GENERATING_STEPS = [
  "Analyzing your brand identity...",
  "Crafting your creator bio...",
  "Designing your storefront...",
  "Building subscription tiers...",
  "Creating product ideas...",
  "Training your AI personality...",
  "Finalizing everything...",
];

function fileIcon(file: File) {
  if (file.type.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  if (file.type.startsWith("video/")) return <Film className="w-4 h-4 text-purple-400" />;
  if (file.type.startsWith("audio/")) return <Music className="w-4 h-4 text-green-400" />;
  return <File className="w-4 h-4 text-white/40" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("form");
  const [loading, setLoading] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [generated, setGenerated] = useState<GeneratedBrand | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<"idle" | "recording" | "done">("idle");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  // Approved state: key → true (accepted) | false (skipped)
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  // Editable content overrides
  const [edits, setEdits] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    username: "", display_name: "",
    date_of_birth: "", gender: "",
    location_country: "", location_city: "",
    location_lat: null as number | null, location_lng: null as number | null,
    niche: "", audience_size: "", content_types: [] as string[],
    instagram_url: "", tiktok_url: "", youtube_url: "", twitter_url: "",
    bio: "", brand_color: "#7c3aed",
    features: [] as string[],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f) => ({ ...f, location_lat: pos.coords.latitude, location_lng: pos.coords.longitude }));
          setLocationGranted(true);
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
            .then((r) => r.json())
            .then((data) => {
              setForm((f) => ({
                ...f,
                location_country: data.address?.country || "",
                location_city: data.address?.city || data.address?.town || data.address?.village || "",
              }));
            })
            .catch(() => {});
        },
        () => {}, { enableHighAccuracy: true }
      );
    }
  }, []);

  function setField(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleArray(key: string, value: string) {
    setForm((f) => {
      const arr = f[key as keyof typeof f] as string[];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    setUploadedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...arr.filter((f) => !existing.has(f.name + f.size))].slice(0, 20);
    });
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedPhoto(file);
    setCapturedPhotoUrl(URL.createObjectURL(file));
    addFiles([file]);
  }

  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) voiceChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        setVoiceRecording("done");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setVoiceRecording("recording");
      setVoiceSeconds(0);
      const interval = setInterval(() => {
        setVoiceSeconds((s) => {
          if (s >= 9) {
            clearInterval(interval);
            recorder.stop();
            return 10;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  function stopVoiceRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleGenerate() {
    setMode("generating");
    setGeneratingStep(0);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Animate steps
    const interval = setInterval(() => {
      setGeneratingStep((s) => Math.min(s + 1, GENERATING_STEPS.length - 1));
    }, 800);

    // Upload files in background
    const uploadedNames: string[] = [];
    for (const file of uploadedFiles.slice(0, 10)) {
      try {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
        uploadedNames.push(file.name);
      } catch { /* continue */ }
    }

    try {
      const res = await fetch("/api/ai/generate-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: {
            ...form,
            instagram_handle: instagramHandle,
            uploaded_file_names: uploadedNames,
          },
        }),
      });

      clearInterval(interval);
      setGeneratingStep(GENERATING_STEPS.length - 1);

      if (!res.ok) throw new Error("Generation failed");
      const { suggestions } = await res.json();
      setGenerated(suggestions);

      // Pre-approve everything
      const initialApproved: Record<string, boolean> = {
        bio: true, tagline: true, storefront_headline: true,
        brand_color: true, ai_personality: true,
      };
      suggestions.subscription_tiers?.forEach((_: unknown, i: number) => { initialApproved[`tier_${i}`] = true; });
      suggestions.product_ideas?.forEach((_: unknown, i: number) => { initialApproved[`product_${i}`] = true; });
      if (suggestions.event_idea) initialApproved["event"] = true;
      setApproved(initialApproved);

      await new Promise((r) => setTimeout(r, 600));
      setMode("review");
    } catch (err) {
      clearInterval(interval);
      toast.error("AI generation failed. Please try again.");
      console.error(err);
      setMode("form");
    }
  }

  async function handleLaunch() {
    if (!generated) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const featureFlags = Object.fromEntries(
      FEATURE_OPTIONS.map((f) => [`${f.id}_enabled`, form.features.includes(f.id)])
    );

    const finalBio = approved.bio ? (edits.bio ?? generated.bio) : form.bio;
    const finalColor = approved.brand_color ? (edits.brand_color ?? generated.brand_color) : form.brand_color;

    const { data: creator, error } = await supabase.from("creators").insert({
      user_id: user.id,
      username: form.username.toLowerCase().replace(/\s+/g, ""),
      display_name: form.display_name,
      bio: finalBio,
      brand_color: finalColor,
      location_country: form.location_country,
      location_city: form.location_city,
      location_lat: form.location_lat,
      location_lng: form.location_lng,
      niche: form.niche,
      audience_size: form.audience_size,
      content_types: form.content_types,
      instagram_url: form.instagram_url || null,
      tiktok_url: form.tiktok_url || null,
      youtube_url: form.youtube_url || null,
      twitter_url: form.twitter_url || null,
      ...featureFlags,
    }).select().single();

    if (error || !creator) {
      toast.error(error?.message || "Failed to create storefront");
      setLoading(false);
      return;
    }

    // Create approved subscription tiers
    const tiersToCreate = (generated.subscription_tiers || [])
      .filter((_, i) => approved[`tier_${i}`])
      .map((t) => ({ creator_id: creator.id, name: t.name, price: t.price, description: t.description, perks: t.perks, is_active: true }));
    if (tiersToCreate.length) await supabase.from("subscription_tiers").insert(tiersToCreate);

    // Create approved draft products
    const productsToCreate = (generated.product_ideas || [])
      .filter((_, i) => approved[`product_${i}`])
      .map((p) => ({ creator_id: creator.id, title: p.name, description: p.description, price: p.price, type: p.type, active: true, images: p.image ? [p.image] : [] }));
    if (productsToCreate.length) await supabase.from("products").insert(productsToCreate);

    // Create approved event
    if (generated.event_idea && approved["event"]) {
      const ev = generated.event_idea;
      await supabase.from("events").insert({
        creator_id: creator.id,
        title: ev.title,
        description: ev.description,
        type: ev.type || "webinar",
        price: ev.price,
        published: true,
        starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Save AI personality
    if (approved.ai_personality) {
      await supabase.from("creator_brand").upsert({
        creator_id: creator.id,
        ai_system_prompt: edits.ai_personality ?? generated.ai_personality,
      }, { onConflict: "creator_id" });
    }

    // Save profile demographics
    await supabase.from("profiles").upsert({
      user_id: user.id,
      email: user.email,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      location_country: form.location_country,
      location_city: form.location_city,
      location_lat: form.location_lat,
      location_lng: form.location_lng,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      browser: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
    }, { onConflict: "user_id" });

    // Auto-submit photo for AI avatar (fire-and-forget)
    if (capturedPhoto) {
      const avatarForm = new FormData();
      avatarForm.append("file", capturedPhoto, capturedPhoto.name);
      avatarForm.append("creator_id", creator.id);
      avatarForm.append("name", form.display_name);
      fetch("/api/avatar/create", { method: "POST", body: avatarForm }).catch(() => {});
    }

    // Auto-submit voice for AI voice clone (fire-and-forget)
    if (voiceBlob) {
      const voiceForm = new FormData();
      voiceForm.append("audio", voiceBlob, "voice.webm");
      voiceForm.append("creator_id", creator.id);
      voiceForm.append("name", form.display_name);
      fetch("/api/voice/clone", { method: "POST", body: voiceForm }).catch(() => {});
    }

    setMode("success");
  }

  const approvedCount = Object.values(approved).filter(Boolean).length;
  const totalCount = Object.keys(approved).length;

  // ─── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (mode === "success") {
    const storefrontUrl = `https://linktohub.vercel.app/${form.username}`;

    async function handleShareStorefront() {
      const shareData = {
        title: `${form.display_name} on Linktohub`,
        text: "Check out my storefront",
        url: storefrontUrl,
      };
      if (typeof navigator !== "undefined" && navigator.share) {
        try { await navigator.share(shareData); } catch { /* cancelled */ }
      } else {
        await navigator.clipboard.writeText(storefrontUrl);
        toast.success("Link copied!");
      }
    }

    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-700/[0.08] blur-[100px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-black mb-2">You&apos;re live! 🎉</h2>
          <p className="text-white/40 mb-8 text-sm">Your storefront is ready for your audience</p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-5 text-left">
            <p className="text-white/30 text-xs font-medium uppercase tracking-wider mb-1.5">Your storefront URL</p>
            <p className="text-white font-bold text-sm break-all">{storefrontUrl}</p>
          </div>

          <button
            onClick={handleShareStorefront}
            className="w-full h-14 btn-gradient rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 mb-3"
          >
            <Share2 className="w-5 h-5" /> Share my storefront
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/dashboard/payouts")}
              className="h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/15 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-4 h-4" /> Set up payouts
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="h-12 rounded-2xl border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors"
            >
              Dashboard →
            </button>
          </div>

          {/* Referral nudge — peak motivation moment */}
          <div className="mt-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-left">
            <p className="text-white/35 text-xs font-medium uppercase tracking-wider mb-2">Know another creator?</p>
            <p className="text-white/55 text-sm mb-3 leading-relaxed">
              Send them to Linktohub — they get a free trial, you help build the community.
            </p>
            <button
              onClick={async () => {
                const referralMsg = `I just launched my creator storefront on Linktohub 🚀 If you're a creator, you should try it — https://linktohub.vercel.app`;
                if (typeof navigator !== "undefined" && navigator.share) {
                  try { await navigator.share({ title: "Linktohub — Creator storefronts", text: referralMsg, url: "https://linktohub.vercel.app" }); } catch { /* cancelled */ }
                } else {
                  await navigator.clipboard.writeText(referralMsg);
                  toast.success("Copied!");
                }
              }}
              className="w-full h-10 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" /> Invite a creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── GENERATING SCREEN ───────────────────────────────────────────────────
  if (mode === "generating") {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-700/[0.08] blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-black mb-2">Building your storefront</h2>
          <p className="text-white/40 mb-10">Claude is analyzing your brand...</p>

          <div className="space-y-3 text-left">
            {GENERATING_STEPS.map((label, i) => (
              <div key={label} className={cn(
                "flex items-center gap-3 text-sm transition-all duration-300",
                i < generatingStep ? "text-white/30" :
                i === generatingStep ? "text-white" :
                "text-white/15"
              )}>
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
                  i < generatingStep ? "bg-violet-500/20" :
                  i === generatingStep ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" :
                  "bg-white/[0.06]"
                )}>
                  {i < generatingStep ? (
                    <Check className="w-3 h-3 text-violet-400" />
                  ) : i === generatingStep ? (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : null}
                </div>
                {label}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${((generatingStep + 1) / GENERATING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── REVIEW SCREEN ───────────────────────────────────────────────────────
  if (mode === "review" && generated) {
    const sections = [
      {
        key: "bio", label: "Your Bio", icon: FileText, color: "text-blue-400",
        content: generated.bio, multiline: true,
      },
      {
        key: "tagline", label: "Storefront Tagline", icon: Sparkles, color: "text-violet-400",
        content: generated.tagline,
      },
      {
        key: "storefront_headline", label: "Hero Headline", icon: Rocket, color: "text-fuchsia-400",
        content: generated.storefront_headline,
      },
      {
        key: "brand_color", label: "Brand Color", icon: null, color: "text-orange-400",
        content: generated.brand_color, isColor: true,
      },
      {
        key: "ai_personality", label: "AI Chat Personality", icon: Bot, color: "text-emerald-400",
        content: generated.ai_personality, multiline: true,
      },
    ];

    return (
      <div className="min-h-screen bg-[#050508] text-white flex flex-col">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-700/[0.05] blur-[100px]" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#050508]/90 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-white">
                <span className="gradient-text">AI-built</span> storefront ready
              </h1>
              <p className="text-white/35 text-xs mt-0.5">{approvedCount} of {totalCount} accepted</p>
            </div>
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="btn-gradient h-10 px-6 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Launching..." : <><Rocket className="w-4 h-4" /> Launch</>}
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-auto pb-8">
          <div className="max-w-2xl mx-auto px-6 pt-6 space-y-3">
            <p className="text-white/30 text-xs text-center mb-6">Review each suggestion — accept, skip, or edit</p>

            {/* Content suggestions */}
            {sections.map(({ key, label, icon: Icon, color, content, multiline, isColor }) => {
              const isApproved = approved[key];
              const isEditing = editingKey === key;
              const displayContent = edits[key] ?? content;

              return (
                <div key={key} className={cn(
                  "card-glass rounded-2xl p-5 transition-all",
                  !isApproved && "opacity-40"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className={cn("w-4 h-4", color)} />}
                      {isColor && (
                        <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: displayContent }} />
                      )}
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        onClick={() => setEditingKey(isEditing ? null : key)}
                        className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Pencil className="w-3.5 h-3.5 text-white/30" />}
                      </button>
                      {/* Regenerate */}
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/ai/generate-brand", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ creator: { ...form, instagram_handle: instagramHandle } }),
                          });
                          if (res.ok) {
                            const { suggestions } = await res.json();
                            if (suggestions[key]) {
                              setEdits((e) => ({ ...e, [key]: suggestions[key] }));
                              toast.success("Regenerated!");
                            }
                          }
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white/30" />
                      </button>
                      {/* Skip */}
                      <button
                        onClick={() => setApproved((a) => ({ ...a, [key]: false }))}
                        className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", !isApproved ? "bg-white/[0.04]" : "hover:bg-white/[0.06]")}
                        title="Skip"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-white/30" />
                      </button>
                      {/* Accept */}
                      <button
                        onClick={() => setApproved((a) => ({ ...a, [key]: true }))}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                          isApproved ? "bg-emerald-500/20" : "hover:bg-white/[0.06]"
                        )}
                        title="Accept"
                      >
                        <CheckCircle2 className={cn("w-3.5 h-3.5", isApproved ? "text-emerald-400" : "text-white/30")} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    isColor ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={displayContent}
                          onChange={(e) => setEdits((d) => ({ ...d, [key]: e.target.value }))}
                          className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <Input
                          value={displayContent}
                          onChange={(e) => setEdits((d) => ({ ...d, [key]: e.target.value }))}
                          className="h-10 bg-white/[0.04] border-white/[0.08] text-white rounded-xl flex-1"
                        />
                      </div>
                    ) : multiline ? (
                      <textarea
                        value={displayContent}
                        onChange={(e) => setEdits((d) => ({ ...d, [key]: e.target.value }))}
                        rows={3}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-violet-500/40"
                      />
                    ) : (
                      <Input
                        value={displayContent}
                        onChange={(e) => setEdits((d) => ({ ...d, [key]: e.target.value }))}
                        className="h-11 bg-white/[0.04] border-white/[0.08] text-white rounded-xl"
                      />
                    )
                  ) : isColor ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: displayContent }} />
                      <span className="text-white font-mono text-sm">{displayContent}</span>
                    </div>
                  ) : (
                    <p className="text-white/80 text-sm leading-relaxed">{displayContent}</p>
                  )}
                </div>
              );
            })}

            {/* Subscription tiers */}
            {generated.subscription_tiers?.length > 0 && (
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-violet-400" />
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Subscription Tiers</span>
                </div>
                <div className="space-y-3">
                  {generated.subscription_tiers.map((tier, i) => {
                    const isApproved = approved[`tier_${i}`];
                    return (
                      <div key={i} className={cn(
                        "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all",
                        !isApproved && "opacity-40"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{tier.name}</span>
                            <span className="text-violet-400 font-bold">${tier.price}/mo</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setApproved((a) => ({ ...a, [`tier_${i}`]: false }))}
                              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", !isApproved ? "bg-white/[0.04]" : "hover:bg-white/[0.06]")}
                            >
                              <SkipForward className="w-3.5 h-3.5 text-white/30" />
                            </button>
                            <button
                              onClick={() => setApproved((a) => ({ ...a, [`tier_${i}`]: true }))}
                              className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", isApproved ? "bg-emerald-500/20" : "hover:bg-white/[0.06]")}
                            >
                              <CheckCircle2 className={cn("w-3.5 h-3.5", isApproved ? "text-emerald-400" : "text-white/30")} />
                            </button>
                          </div>
                        </div>
                        <p className="text-white/50 text-xs mb-2">{tier.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tier.perks.map((p) => (
                            <span key={p} className="bg-violet-500/10 text-violet-300 text-xs px-2 py-0.5 rounded-full">{p}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product ideas */}
            {generated.product_ideas?.length > 0 && (
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Product Ideas</span>
                  <span className="text-white/25 text-xs">(published instantly)</span>
                </div>
                <div className="space-y-3">
                  {generated.product_ideas.map((product, i) => {
                    const isApproved = approved[`product_${i}`];
                    return (
                      <div key={i} className={cn(
                        "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all",
                        !isApproved && "opacity-40"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white text-sm">{product.name}</span>
                              <span className="text-xs bg-white/[0.06] text-white/40 px-2 py-0.5 rounded-full capitalize">{product.type}</span>
                            </div>
                            <p className="text-white/45 text-xs">{product.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-white/70 text-sm font-bold">${product.price}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setApproved((a) => ({ ...a, [`product_${i}`]: false }))}
                                className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", !isApproved ? "bg-white/[0.04]" : "hover:bg-white/[0.06]")}
                              >
                                <SkipForward className="w-3.5 h-3.5 text-white/30" />
                              </button>
                              <button
                                onClick={() => setApproved((a) => ({ ...a, [`product_${i}`]: true }))}
                                className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", isApproved ? "bg-emerald-500/20" : "hover:bg-white/[0.06]")}
                              >
                                <CheckCircle2 className={cn("w-3.5 h-3.5", isApproved ? "text-emerald-400" : "text-white/30")} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event idea */}
            {generated.event_idea && (
              <div className="card-glass rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Event Idea</span>
                  <span className="text-white/25 text-xs">(published instantly)</span>
                </div>
                <div className={cn(
                  "bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all",
                  !approved["event"] && "opacity-40"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{generated.event_idea.title}</span>
                        <span className="text-xs bg-white/[0.06] text-white/40 px-2 py-0.5 rounded-full capitalize">{generated.event_idea.type}</span>
                      </div>
                      <p className="text-white/45 text-xs">{generated.event_idea.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="text-white/70 text-sm font-bold">${generated.event_idea.price}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setApproved((a) => ({ ...a, event: false }))}
                          className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", !approved["event"] ? "bg-white/[0.04]" : "hover:bg-white/[0.06]")}
                        >
                          <SkipForward className="w-3.5 h-3.5 text-white/30" />
                        </button>
                        <button
                          onClick={() => setApproved((a) => ({ ...a, event: true }))}
                          className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", approved["event"] ? "bg-emerald-500/20" : "hover:bg-white/[0.06]")}
                        >
                          <CheckCircle2 className={cn("w-3.5 h-3.5", approved["event"] ? "text-emerald-400" : "text-white/30")} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Launch button at bottom */}
            <div className="pt-4 pb-8">
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="w-full h-14 btn-gradient rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                {loading ? "Creating your storefront..." : (
                  <><Rocket className="w-5 h-5" /> Launch my storefront</>
                )}
              </button>
              <p className="text-center text-white/20 text-xs mt-3">
                {approvedCount} items will be created automatically
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM STEPS ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-700/[0.06] blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
        <span className="text-lg font-black tracking-tight">
          <span className="gradient-text">link</span>tohub
        </span>
        <span className="text-white/25 text-sm">{step} / {STEP_LABELS.length}</span>
      </div>

      {/* Progress */}
      <div className="relative z-10 h-[2px] bg-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${(step / STEP_LABELS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="relative z-10 flex justify-center gap-4 sm:gap-6 px-6 py-4">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i + 1 < step ? "bg-violet-500 text-white" :
              i + 1 === step ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30" :
              "bg-white/[0.06] text-white/25"
            )}>
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className={cn("text-[10px] font-medium hidden sm:block", i + 1 === step ? "text-white/70" : "text-white/20")}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Claim your link</h2>
                <p className="text-white/40">This becomes your storefront URL</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Your handle</label>
                  <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl h-12 px-4 focus-within:border-violet-500/40 transition-colors">
                    <span className="text-white/25 text-sm">linktohub.com/</span>
                    <input
                      value={form.username}
                      onChange={(e) => setField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="yourname"
                      className="flex-1 bg-transparent text-white placeholder:text-white/20 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Display name</label>
                  <Input
                    value={form.display_name}
                    onChange={(e) => setField("display_name", e.target.value)}
                    placeholder="Your Name"
                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Your niche <span className="text-white/20 normal-case">(powers AI)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => (
                      <button key={n} type="button" onClick={() => setField("niche", n)} className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        form.niche === n
                          ? "bg-violet-600/20 border-violet-500/50 text-violet-200"
                          : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white"
                      )}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Where are you based?</h2>
                <p className="text-white/40">Helps AI tailor your products to your market · <button type="button" onClick={() => setStep(3)} className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">Skip</button></p>
              </div>
              <div className="space-y-4">
                {locationGranted && (
                  <div className="flex items-center gap-2 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl px-4 py-3">
                    <span className="text-emerald-400 text-sm">✓</span>
                    <p className="text-emerald-400/80 text-sm">Location auto-detected — confirm or edit below</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Country</label>
                  <Input value={form.location_country} onChange={(e) => setField("location_country", e.target.value)} placeholder="United States" className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">City</label>
                  <Input value={form.location_city} onChange={(e) => setField("location_city", e.target.value)} placeholder="New York" className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Your audience</h2>
                <p className="text-white/40">Tell us about your content</p>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Audience size</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AUDIENCE_SIZES.map((s) => (
                      <button key={s} type="button" onClick={() => setField("audience_size", s)} className={cn("h-10 rounded-xl border text-sm font-medium transition-all", form.audience_size === s ? "bg-violet-600/20 border-violet-500/50 text-violet-200" : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white")}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Content types</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((c) => (
                      <button key={c} type="button" onClick={() => toggleArray("content_types", c)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all", form.content_types.includes(c) ? "bg-violet-600/20 border-violet-500/50 text-violet-200" : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white")}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Socials (optional)</label>
                  {[
                    { key: "instagram_url", placeholder: "Instagram username" },
                    { key: "tiktok_url", placeholder: "TikTok username" },
                    { key: "youtube_url", placeholder: "YouTube channel URL" },
                    { key: "twitter_url", placeholder: "Twitter/X handle" },
                  ].map(({ key, placeholder }) => (
                    <Input key={key} value={form[key as keyof typeof form] as string} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Your brand</h2>
                <p className="text-white/40">How you appear to your audience</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Bio <span className="text-white/20 normal-case">(optional — AI will enhance it)</span></label>
                  <textarea value={form.bio} onChange={(e) => setField("bio", e.target.value)} placeholder="Tell your audience who you are..." rows={4} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white placeholder:text-white/20 outline-none resize-none focus:border-violet-500/40 text-sm transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Brand color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-white/20 cursor-pointer overflow-hidden shrink-0" style={{ backgroundColor: form.brand_color }}>
                      <input type="color" value={form.brand_color} onChange={(e) => setField("brand_color", e.target.value)} className="w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    <Input value={form.brand_color} onChange={(e) => setField("brand_color", e.target.value)} placeholder="#7c3aed" className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl flex-1" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {["#7c3aed", "#2563eb", "#dc2626", "#ea580c", "#16a34a", "#0891b2"].map((c) => (
                      <button key={c} type="button" onClick={() => setField("brand_color", c)} className="w-8 h-8 rounded-lg border-2 transition-all" style={{ backgroundColor: c, borderColor: form.brand_color === c ? "white" : "transparent" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Pick your features</h2>
                <p className="text-white/40">Activate what matters — add more later</p>
              </div>
              <div className="space-y-2.5">
                {FEATURE_OPTIONS.map(({ id, icon: Icon, label, desc }) => (
                  <button key={id} type="button" onClick={() => toggleArray("features", id)} className={cn("w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4", form.features.includes(id) ? "bg-violet-600/15 border-violet-500/40" : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/10")}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", form.features.includes(id) ? "bg-violet-500/20" : "bg-white/[0.05]")}>
                      <Icon className={cn("w-5 h-5", form.features.includes(id) ? "text-violet-400" : "text-white/30")} />
                    </div>
                    <div>
                      <div className={cn("font-bold text-sm", form.features.includes(id) ? "text-white" : "text-white/70")}>{label}</div>
                      <div className={cn("text-xs mt-0.5", form.features.includes(id) ? "text-violet-300/60" : "text-white/30")}>{desc}</div>
                    </div>
                    <div className={cn("ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", form.features.includes(id) ? "border-violet-400 bg-violet-400" : "border-white/20")}>
                      {form.features.includes(id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Brand Assets */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black mb-2">Show us your brand</h2>
                <p className="text-white/40">AI builds everything — your avatar, voice clone, merch, and more</p>
              </div>

              {/* Camera + Voice capture row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Camera */}
                <div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleCameraCapture}
                  />
                  {capturedPhotoUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] h-32">
                      <img src={capturedPhotoUrl} alt="avatar" className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-xs text-white px-2 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Avatar photo
                      </div>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full h-32 rounded-2xl border border-white/[0.08] hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-violet-400"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-xs font-medium">Take avatar photo</span>
                    </button>
                  )}
                </div>

                {/* Voice */}
                <div>
                  {voiceRecording === "idle" && (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="w-full h-32 rounded-2xl border border-white/[0.08] hover:border-violet-500/40 hover:bg-violet-500/[0.04] transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-violet-400"
                    >
                      <Mic className="w-8 h-8" />
                      <span className="text-xs font-medium">Record your voice</span>
                    </button>
                  )}
                  {voiceRecording === "recording" && (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="w-full h-32 rounded-2xl border border-red-500/40 bg-red-500/[0.06] flex flex-col items-center justify-center gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1 rounded-full bg-red-400 animate-pulse" style={{ height: `${8 + Math.random() * 20}px`, animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-red-400 font-medium">{voiceSeconds}s — tap to stop</span>
                    </button>
                  )}
                  {voiceRecording === "done" && (
                    <div className="w-full h-32 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Voice captured</span>
                      <button onClick={() => setVoiceRecording("idle")} className="text-xs text-white/30 hover:text-white/60">Re-record</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Instagram handle */}
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">
                  Instagram handle
                </label>
                <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl h-12 px-4 focus-within:border-violet-500/40 transition-colors">
                  <span className="text-white/25 text-sm">@</span>
                  <input
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value.replace("@", ""))}
                    placeholder="yourhandle"
                    className="flex-1 bg-transparent text-white placeholder:text-white/20 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-white/25 text-xs">and / or</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>

              {/* Drag & drop upload */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <Upload className="w-8 h-8 text-white/25 mx-auto mb-3" />
                <p className="text-white/60 font-medium text-sm">Drop files here or click to browse</p>
                <p className="text-white/25 text-xs mt-1">Photos, videos, audio, PDFs, logos — up to 50MB each</p>
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white/30 text-xs font-medium uppercase tracking-wider">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} added</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                        {fileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-sm truncate">{file.name}</p>
                          <p className="text-white/25 text-xs">{formatBytes(file.size)}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setUploadedFiles((f) => f.filter((_, j) => j !== i)); }} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-white/30" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="bg-violet-500/[0.07] border border-violet-500/20 rounded-xl p-4 text-sm text-violet-300/80">
                <strong className="text-violet-300">How it works:</strong> Claude analyzes your files, Instagram content, and answers — then generates your complete bio, subscription tiers, product ideas, AI personality, and brand colors. You review and approve each one before it goes live.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-10">
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="flex-1 h-12 rounded-xl border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] text-sm font-medium transition-all">
                ← Back
              </button>
            )}
            {step < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !form.username) { toast.error("Pick a username"); return; }
                  if (step === 1 && !form.niche) { toast.error("Select your niche — it powers AI generation"); return; }
                  setStep((s) => (s + 1) as Step);
                }}
                className="flex-1 h-12 rounded-xl btn-gradient text-white font-bold text-sm"
              >
                {step === 2 ? "Looks good →" : "Continue →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="flex-1 h-14 rounded-xl btn-gradient text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                <Sparkles className="w-5 h-5" />
                Build with AI →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
