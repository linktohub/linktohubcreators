"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Bot, Mic, Video, Plus, X, Square,
  CheckCircle2, Loader2, Upload, Play, Pause,
} from "lucide-react";

type FAQ = { q: string; a: string };

export default function AIPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState("");

  const [brandVoice, setBrandVoice] = useState("");
  const [sampleContent, setSampleContent] = useState([""]);
  const [faqs, setFaqs] = useState<FAQ[]>([{ q: "", a: "" }]);

  // Voice clone state
  const [voiceStatus, setVoiceStatus] = useState<"none" | "recording" | "recorded" | "uploading" | "ready">("none");
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [existingVoiceId, setExistingVoiceId] = useState<string | null>(null);

  // Avatar state
  const [avatarStatus, setAvatarStatus] = useState<"none" | "uploading" | "processing" | "ready">("none");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [existingAvatarId, setExistingAvatarId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creator } = await supabase.from("creators").select("id, display_name").eq("user_id", user.id).single();
      if (!creator) return;
      setCreatorId(creator.id);
      setCreatorName(creator.display_name || "");

      const { data: brand } = await supabase.from("creator_brand").select("*").eq("creator_id", creator.id).single();
      if (brand) {
        setBrandVoice(brand.brand_voice_description || "");
        setSampleContent(brand.sample_content?.length ? brand.sample_content : [""]);
        if (brand.faq?.length) setFaqs(brand.faq);
        if (brand.elevenlabs_voice_id) { setExistingVoiceId(brand.elevenlabs_voice_id); setVoiceStatus("ready"); }
        if (brand.heygen_avatar_id) { setExistingAvatarId(brand.heygen_avatar_id); setAvatarStatus("ready"); }
      }
      setLoadingData(false);
    }
    load();
  }, []);

  // ── Voice recording ────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setVoiceBlob(blob);
        setVoiceAudioUrl(url);
        setVoiceStatus("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(1000);
      setVoiceStatus("recording");
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleVoiceFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVoiceBlob(file);
    setVoiceAudioUrl(url);
    setVoiceStatus("recorded");
  }

  async function cloneVoice() {
    if (!voiceBlob || !creatorId) return;
    setVoiceStatus("uploading");

    const formData = new FormData();
    formData.append("audio", voiceBlob, "voice-sample.webm");
    formData.append("creator_id", creatorId);
    formData.append("name", creatorName);

    const res = await fetch("/api/voice/clone", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to clone voice");
      setVoiceStatus("recorded");
      return;
    }

    setExistingVoiceId(data.voice_id);
    setVoiceStatus("ready");
    toast.success("AI voice created!");
  }

  // ── Avatar creation ────────────────────────────────────────────────────
  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  }

  async function createAvatar() {
    if (!avatarFile || !creatorId) return;
    setAvatarStatus("uploading");

    const formData = new FormData();
    formData.append("file", avatarFile);
    formData.append("creator_id", creatorId);
    formData.append("name", creatorName);

    const res = await fetch("/api/avatar/create", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to create avatar");
      setAvatarStatus("none");
      return;
    }

    setExistingAvatarId(data.avatar_id);
    setAvatarStatus("ready");
    toast.success("AI avatar created!");
  }

  // ── Save chat settings ─────────────────────────────────────────────────
  async function handleSave() {
    if (!creatorId) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("creator_brand").upsert({
      creator_id: creatorId,
      brand_voice_description: brandVoice || null,
      sample_content: sampleContent.filter((s) => s.trim()),
      faq: faqs.filter((f) => f.q.trim() && f.a.trim()),
    }, { onConflict: "creator_id" });

    if (error) toast.error(error.message);
    else toast.success("AI settings saved!");
    setSaving(false);
  }

  if (loadingData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">AI Studio</h1>
          <p className="text-white/35 mt-0.5 text-sm">Your voice, your avatar, your AI</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── AI VOICE ─────────────────────────────────────────────────── */}
        <section className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Mic className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-black text-lg">Clone Your Voice</h2>
              <p className="text-white/35 text-xs">Record 1-2 minutes — we'll make your AI sound just like you</p>
            </div>
            {voiceStatus === "ready" && (
              <span className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Voice ready
              </span>
            )}
          </div>

          {voiceStatus === "ready" ? (
            <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Your AI voice is live</p>
                <p className="text-emerald-400/50 text-xs mt-0.5">Fans can trigger your voice in AI chat</p>
              </div>
              <button
                onClick={() => { setVoiceStatus("none"); setVoiceBlob(null); setVoiceAudioUrl(null); }}
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Re-record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Record area */}
              {voiceStatus === "none" || voiceStatus === "recording" ? (
                <div className="text-center">
                  <p className="text-white/40 text-sm mb-4">
                    Speak naturally about your content, your story, your brand. The more you say, the better it sounds.
                  </p>
                  {voiceStatus === "recording" ? (
                    <div className="space-y-4">
                      {/* Waveform animation */}
                      <div className="flex items-center justify-center gap-1 h-12">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-violet-500 animate-pulse"
                            style={{
                              height: `${Math.random() * 28 + 8}px`,
                              animationDelay: `${i * 50}ms`,
                              animationDuration: `${400 + Math.random() * 400}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-white/60 text-sm font-mono">
                        {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")} recording
                        {recordingSeconds >= 30 && <span className="text-emerald-400 ml-2">✓ good length</span>}
                      </p>
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 mx-auto bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                      >
                        <Square className="w-4 h-4" /> Stop recording
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-2 mx-auto btn-gradient px-8 py-3 rounded-xl font-bold text-sm text-white"
                      >
                        <Mic className="w-4 h-4" /> Start recording
                      </button>
                      <p className="text-white/20 text-xs">— or —</p>
                      <button
                        onClick={() => voiceFileInputRef.current?.click()}
                        className="flex items-center gap-2 mx-auto border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.05] px-6 py-2.5 rounded-xl text-sm transition-all"
                      >
                        <Upload className="w-4 h-4" /> Upload audio file
                      </button>
                      <input ref={voiceFileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleVoiceFileUpload} />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Recorded — preview + clone */}
              {(voiceStatus === "recorded" || voiceStatus === "uploading") && voiceAudioUrl && (
                <div className="space-y-4">
                  <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (!audioRef.current) audioRef.current = new Audio(voiceAudioUrl);
                        if (isPlayingVoice) { audioRef.current.pause(); setIsPlayingVoice(false); }
                        else { audioRef.current.play(); setIsPlayingVoice(true); audioRef.current.onended = () => setIsPlayingVoice(false); }
                      }}
                      className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 hover:bg-violet-500/30 transition-colors shrink-0"
                    >
                      {isPlayingVoice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-white/70 text-sm font-medium">Your recording</p>
                      <p className="text-white/30 text-xs">{recordingSeconds > 0 ? `${recordingSeconds}s` : "Uploaded file"}</p>
                    </div>
                    <button onClick={() => { setVoiceStatus("none"); setVoiceBlob(null); setVoiceAudioUrl(null); }}
                      className="text-white/25 hover:text-white/60 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={cloneVoice}
                    disabled={voiceStatus === "uploading"}
                    className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {voiceStatus === "uploading" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating your AI voice...</>
                    ) : (
                      <><Mic className="w-4 h-4" /> Create my AI voice</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── AI AVATAR ────────────────────────────────────────────────── */}
        <section className="card-glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h2 className="font-black text-lg">Create Your AI Avatar</h2>
              <p className="text-white/35 text-xs">Upload a photo or short video — your AI will look like you</p>
            </div>
            {avatarStatus === "ready" && (
              <span className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Avatar ready
              </span>
            )}
          </div>

          {avatarStatus === "ready" ? (
            <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Your AI avatar is live</p>
                <p className="text-emerald-400/50 text-xs mt-0.5">Fans can video chat with your AI likeness</p>
              </div>
              <button
                onClick={() => { setAvatarStatus("none"); setAvatarFile(null); setAvatarPreviewUrl(null); }}
                className="text-xs text-white/30 hover:text-white transition-colors"
              >
                Update photo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input ref={avatarInputRef} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={handleAvatarFile} />

              {!avatarFile ? (
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="border-2 border-dashed border-white/[0.08] hover:border-white/20 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-white/[0.02]"
                >
                  <Upload className="w-8 h-8 text-white/25 mx-auto mb-3" />
                  <p className="text-white/60 font-medium text-sm">Upload your photo or video</p>
                  <p className="text-white/25 text-xs mt-1">Clear face, good lighting · Photo or 5-10s video</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
                    {avatarPreviewUrl && avatarFile.type.startsWith("image/") && (
                      <img src={avatarPreviewUrl} alt="Avatar preview" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    {avatarFile.type.startsWith("video/") && (
                      <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                        <Video className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm font-medium truncate">{avatarFile.name}</p>
                      <p className="text-white/30 text-xs">{(avatarFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={() => { setAvatarFile(null); setAvatarPreviewUrl(null); }}
                      className="text-white/25 hover:text-white/60 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={createAvatar}
                    disabled={avatarStatus === "uploading" || avatarStatus === "processing"}
                    className="w-full h-12 btn-gradient rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {avatarStatus === "uploading" || avatarStatus === "processing" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating your AI avatar...</>
                    ) : (
                      <><Video className="w-4 h-4" /> Create my AI avatar</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── AI CHAT ──────────────────────────────────────────────────── */}
        <section className="card-glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-black text-lg">AI Chat Personality</h2>
              <p className="text-white/35 text-xs">How your AI talks to your fans</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Your voice & style</label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Describe how you communicate: casual and hype, direct and no-BS, warm and supportive. Example: 'I keep it real with my followers. Short sentences, motivational, I use slang from the fitness world.'"
              rows={4}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white placeholder:text-white/20 outline-none resize-none focus:border-violet-500/40 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Sample content (captions, quotes)</label>
            <div className="space-y-2">
              {sampleContent.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={s}
                    onChange={(e) => { const n = [...sampleContent]; n[i] = e.target.value; setSampleContent(n); }}
                    placeholder={`"Stop waiting for motivation. Be the motivation."`}
                    className="h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40 rounded-xl flex-1"
                  />
                  {sampleContent.length > 1 && (
                    <button type="button" onClick={() => setSampleContent((c) => c.filter((_, idx) => idx !== i))}
                      className="text-white/25 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setSampleContent((c) => [...c, ""])}
                className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add sample
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-white/40 text-xs font-medium uppercase tracking-wider">FAQ — teach your AI common questions</label>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2 relative">
                  {faqs.length > 1 && (
                    <button type="button" onClick={() => setFaqs((f) => f.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-white/25 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <Input value={faq.q} onChange={(e) => { const n = [...faqs]; n[i] = { ...n[i], q: e.target.value }; setFaqs(n); }}
                    placeholder="Question: How do I buy your merch?"
                    className="h-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl" />
                  <textarea value={faq.a} onChange={(e) => { const n = [...faqs]; n[i] = { ...n[i], a: e.target.value }; setFaqs(n); }}
                    placeholder="Answer: Head to the Store tab and pick what you want. Shipping is fast!"
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder:text-white/20 outline-none resize-none focus:border-violet-500/40" />
                </div>
              ))}
              <button type="button" onClick={() => setFaqs((f) => [...f, { q: "", a: "" }])}
                className="flex items-center gap-1.5 text-white/35 hover:text-white text-sm transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn("w-full h-12 rounded-xl font-bold text-sm transition-all", saving ? "bg-white/10 text-white/40" : "btn-gradient text-white")}
          >
            {saving ? "Saving..." : "Save AI Settings →"}
          </button>
        </section>
      </div>
    </div>
  );
}
