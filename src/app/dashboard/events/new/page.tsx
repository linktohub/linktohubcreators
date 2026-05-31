"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const EVENT_TYPES = [
  { id: "webinar", label: "💻 Webinar" },
  { id: "zoom", label: "🎥 Zoom Call" },
  { id: "seminar", label: "🎤 Seminar" },
  { id: "livestream", label: "🔴 Livestream" },
  { id: "in_person", label: "📍 In Person" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "webinar",
    starts_at: "",
    ends_at: "",
    price: "",
    max_attendees: "",
    meeting_url: "",
    location_address: "",
    published: false,
  });

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.starts_at) { toast.error("Title and start time required"); return; }
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
    if (!creator) { router.push("/onboarding"); return; }

    const { error } = await supabase.from("events").insert({
      creator_id: creator.id,
      title: form.title,
      description: form.description || null,
      type: form.type,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      price: parseFloat(form.price) || 0,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      meeting_url: form.meeting_url || null,
      location_address: form.location_address || null,
      published: form.published,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Event created!");
    router.push("/dashboard/events");
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/events">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-white/70">Event type</Label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => set("type", t.id)}
                className={cn("p-3 rounded-xl border text-sm font-medium transition-colors",
                  form.type === t.id ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                )}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Live Q&A Session" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" required />
        </div>

        <div className="space-y-2">
          <Label className="text-white/70">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell your audience what to expect..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/70">Start date & time</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} className="h-12 bg-white/5 border-white/10 text-white" required />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">End time (optional)</Label>
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} className="h-12 bg-white/5 border-white/10 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white/70">Ticket price (0 = free)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
              <Input value={form.price} onChange={(e) => set("price", e.target.value)} type="number" step="0.01" min="0" placeholder="0" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-8" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Max attendees</Label>
            <Input value={form.max_attendees} onChange={(e) => set("max_attendees", e.target.value)} type="number" min="1" placeholder="Unlimited" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        </div>

        {(form.type === "webinar" || form.type === "zoom" || form.type === "livestream") && (
          <div className="space-y-2">
            <Label className="text-white/70">Meeting URL</Label>
            <Input value={form.meeting_url} onChange={(e) => set("meeting_url", e.target.value)} placeholder="https://zoom.us/j/..." className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        )}

        {form.type === "in_person" && (
          <div className="space-y-2">
            <Label className="text-white/70">Location</Label>
            <Input value={form.location_address} onChange={(e) => set("location_address", e.target.value)} placeholder="123 Main St, New York" className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div>
            <p className="font-semibold text-sm">Publish immediately</p>
            <p className="text-white/40 text-xs">Show on your storefront now</p>
          </div>
          <button type="button" onClick={() => set("published", !form.published)}
            className={cn("w-12 h-6 rounded-full transition-colors relative", form.published ? "bg-white" : "bg-white/20")}>
            <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-black transition-all", form.published ? "left-7" : "left-1")} />
          </button>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-base">
          {loading ? "Creating..." : "Create Event →"}
        </Button>
      </form>
    </div>
  );
}
