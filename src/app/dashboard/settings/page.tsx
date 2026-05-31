"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, Camera, Image } from "lucide-react";
import Link from "next/link";

type Creator = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  niche: string;
  brand_color: string;
  avatar_url: string;
  cover_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  twitter_url: string;
  twitch_url: string;
  merch_enabled: boolean;
  digital_enabled: boolean;
  ai_chat_enabled: boolean;
  ai_voice_enabled: boolean;
  ai_video_enabled: boolean;
  calendar_enabled: boolean;
  events_enabled: boolean;
  subscriptions_enabled: boolean;
  tips_enabled: boolean;
};

const FEATURES = [
  { key: "merch_enabled", label: "👕 Merch Store" },
  { key: "digital_enabled", label: "📄 Digital Products" },
  { key: "ai_chat_enabled", label: "🤖 AI Chat" },
  { key: "ai_voice_enabled", label: "🎙️ AI Voice Calls" },
  { key: "ai_video_enabled", label: "🎬 AI Video Avatar" },
  { key: "calendar_enabled", label: "📅 Bookings" },
  { key: "events_enabled", label: "🎟️ Events" },
  { key: "subscriptions_enabled", label: "⭐ Subscriptions" },
  { key: "tips_enabled", label: "💸 Tips" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [totalAffiliate, setTotalAffiliate] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("creators").select("*").eq("user_id", user.id).single();
      if (data) setCreator(data);

      // Load affiliate info
      const { data: aff } = await supabase.from("affiliates").select("*").eq("referrer_creator_id", data?.id).single();
      if (aff) {
        setAffiliateCode(aff.referral_code);
        setTotalAffiliate(aff.total_earned);
      }

      setLoading(false);
    }
    load();
  }, []);

  function toggleFeature(key: string) {
    if (!creator) return;
    setCreator((c) => c ? { ...c, [key]: !c[key as keyof Creator] } : c);
  }

  async function uploadImage(file: File, bucket: string, field: "avatar_url" | "cover_url") {
    if (!creator) return;
    const ext = file.name.split(".").pop();
    const path = `${creator.id}/${field}-${Date.now()}.${ext}`;

    const form = new FormData();
    form.append("file", file);
    form.append("bucket", bucket);
    form.append("path", path);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const { url, error } = await res.json();
    if (error || !url) { toast.error(error || "Upload failed"); return; }

    setCreator((c) => c ? { ...c, [field]: url } : c);
    const supabase = createClient();
    await supabase.from("creators").update({ [field]: url }).eq("id", creator.id);
    toast.success("Photo updated!");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    await uploadImage(file, "brand-assets", "avatar_url");
    setUploadingAvatar(false);
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    await uploadImage(file, "brand-assets", "cover_url");
    setUploadingBanner(false);
  }

  async function handleSave() {
    if (!creator) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("creators").update({
      display_name: creator.display_name,
      bio: creator.bio,
      niche: creator.niche || null,
      brand_color: creator.brand_color,
      avatar_url: creator.avatar_url || null,
      cover_url: creator.cover_url || null,
      instagram_url: creator.instagram_url || null,
      tiktok_url: creator.tiktok_url || null,
      youtube_url: creator.youtube_url || null,
      twitter_url: creator.twitter_url || null,
      twitch_url: creator.twitch_url || null,
      merch_enabled: creator.merch_enabled,
      digital_enabled: creator.digital_enabled,
      ai_chat_enabled: creator.ai_chat_enabled,
      ai_voice_enabled: creator.ai_voice_enabled,
      ai_video_enabled: creator.ai_video_enabled,
      calendar_enabled: creator.calendar_enabled,
      events_enabled: creator.events_enabled,
      subscriptions_enabled: creator.subscriptions_enabled,
      tips_enabled: creator.tips_enabled,
    }).eq("id", creator.id);

    if (error) toast.error(error.message);
    else toast.success("Settings saved!");
    setSaving(false);
  }

  async function generateAffiliateCode() {
    if (!creator) return;
    const code = `${creator.username}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const supabase = createClient();
    await supabase.from("affiliates").upsert({
      referrer_creator_id: creator.id,
      referral_code: code,
    }, { onConflict: "referrer_creator_id" });
    setAffiliateCode(code);
    toast.success("Affiliate link generated!");
  }

  if (loading) return <div className="p-6 text-white/40">Loading...</div>;
  if (!creator) return null;

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Settings</h1>
          <p className="text-white/40 mt-1">Manage your profile and features</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden space-y-5">
          {/* Banner */}
          <div className="relative">
            <div
              className="h-32 w-full relative cursor-pointer group"
              style={{ backgroundColor: creator.brand_color || "#7c3aed" }}
              onClick={() => bannerInputRef.current?.click()}
            >
              {creator.cover_url && (
                <img src={creator.cover_url} alt="banner" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Image className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">{uploadingBanner ? "Uploading..." : "Change banner"}</span>
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={uploadingBanner} />
            </div>

            {/* Avatar overlapping banner */}
            <div className="absolute -bottom-10 left-6">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-[#050508] overflow-hidden cursor-pointer relative group"
                style={{ backgroundColor: creator.brand_color || "#7c3aed" }}
                onClick={() => avatarInputRef.current?.click()}
              >
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white">
                    {creator.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
              </div>
            </div>
          </div>

          <div className="pt-10 px-6 pb-6 space-y-5">
          <h2 className="text-lg font-bold">Profile</h2>

          <div className="space-y-2">
            <Label className="text-white/70">Username</Label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl h-12 px-4 text-white/40 text-sm">
              linktohub.com/{creator.username}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Display name</Label>
            <Input value={creator.display_name || ""} onChange={(e) => setCreator((c) => c ? { ...c, display_name: e.target.value } : c)}
              className="h-12 bg-white/5 border-white/10 text-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Bio</Label>
            <Textarea value={creator.bio || ""} onChange={(e) => setCreator((c) => c ? { ...c, bio: e.target.value } : c)}
              className="bg-white/5 border-white/10 text-white min-h-[80px]" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Niche / Category</Label>
            <Input
              value={creator.niche || ""}
              onChange={(e) => setCreator((c) => c ? { ...c, niche: e.target.value } : c)}
              placeholder="e.g. fitness, comedy, real estate, cooking, gaming..."
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20"
            />
            <p className="text-white/30 text-xs">This tells AI what kind of products and content to create for you</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70">Brand color</Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-white/20 overflow-hidden" style={{ backgroundColor: creator.brand_color }}>
                <input type="color" value={creator.brand_color} onChange={(e) => setCreator((c) => c ? { ...c, brand_color: e.target.value } : c)}
                  className="w-full h-full opacity-0 cursor-pointer" />
              </div>
              <Input value={creator.brand_color} onChange={(e) => setCreator((c) => c ? { ...c, brand_color: e.target.value } : c)}
                className="h-12 bg-white/5 border-white/10 text-white flex-1" />
            </div>
          </div>
          </div>
        </section>

        {/* Socials */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">Social Links</h2>
          {[
            { key: "instagram_url", placeholder: "@instagramhandle", label: "Instagram" },
            { key: "tiktok_url", placeholder: "@tiktokhandle", label: "TikTok" },
            { key: "youtube_url", placeholder: "YouTube channel URL", label: "YouTube" },
            { key: "twitter_url", placeholder: "@twitterhandle", label: "Twitter / X" },
            { key: "twitch_url", placeholder: "Twitch username", label: "Twitch" },
          ].map(({ key, placeholder, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-white/50 text-xs">{label}</Label>
              <Input
                value={(creator[key as keyof Creator] as string) || ""}
                onChange={(e) => setCreator((c) => c ? { ...c, [key]: e.target.value } : c)}
                placeholder={placeholder}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-5">Features</h2>
          <div className="space-y-1">
            {FEATURES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <span className="text-sm font-medium">{label}</span>
                <button
                  type="button"
                  onClick={() => toggleFeature(key)}
                  className={cn("w-12 h-6 rounded-full transition-colors relative shrink-0",
                    creator[key as keyof Creator] ? "bg-white" : "bg-white/20"
                  )}
                >
                  <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-black transition-all",
                    creator[key as keyof Creator] ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliate */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-2">Affiliate Program</h2>
          <p className="text-white/40 text-sm mb-5">Refer other creators and earn 20% of their platform fee</p>

          {affiliateCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-white/10 px-4 py-3 rounded-xl text-sm font-mono">
                  linktohub.com/ref/{affiliateCode}
                </code>
                <Button
                  variant="outline"
                  onClick={() => { navigator.clipboard.writeText(`https://linktohub.com/ref/${affiliateCode}`); toast.success("Copied!"); }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Copy
                </Button>
              </div>
              <p className="text-white/40 text-sm">Total earned: <span className="text-white font-bold">${totalAffiliate.toFixed(2)}</span></p>
            </div>
          ) : (
            <button onClick={generateAffiliateCode}
              className="px-5 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/[0.08] text-sm font-semibold transition-colors">
              Generate affiliate link
            </button>
          )}
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-base">
          {saving ? "Saving..." : "Save Settings →"}
        </Button>
      </div>
    </div>
  );
}
