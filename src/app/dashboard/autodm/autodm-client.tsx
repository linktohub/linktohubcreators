"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Instagram, MessageCircle, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  creatorId: string;
  username: string;
  isConnected: boolean;
  initialKeyword: string;
  initialMessage: string;
  initialEnabled: boolean;
}

export default function AutoDMClient({
  creatorId,
  username,
  isConnected,
  initialKeyword,
  initialMessage,
  initialEnabled,
}: Props) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [message, setMessage] = useState(initialMessage);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  function connectInstagram() {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    if (!appId) {
      toast.error("Instagram integration not configured yet.");
      return;
    }
    const redirect = encodeURIComponent(`${window.location.origin}/api/autodm/ig-callback`);
    const state = encodeURIComponent(creatorId);
    window.location.href = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirect}&scope=user_profile,user_media&response_type=code&state=${state}`;
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/autodm/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.toUpperCase().trim(), message, enabled }),
      });
      if (!res.ok) throw new Error();
      toast.success("AutoDM settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Connect card */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Instagram</p>
              <p className="text-white/40 text-sm">{isConnected ? "Connected" : "Not connected"}</p>
            </div>
          </div>
          {isConnected ? (
            <span className="text-emerald-400 text-sm font-semibold">✓ Active</span>
          ) : (
            <button
              onClick={connectInstagram}
              className="h-10 px-5 rounded-xl btn-gradient text-white text-sm font-bold"
            >
              Connect Instagram
            </button>
          )}
        </div>
      </div>

      {/* Trigger keyword */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-violet-400" />
          <p className="font-bold text-white">Trigger keyword</p>
        </div>
        <p className="text-white/40 text-sm">When someone comments this word on your post, they'll get your DM.</p>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value.toUpperCase())}
          placeholder="LINK"
          className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl font-mono font-bold uppercase"
        />
      </div>

      {/* DM message */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-fuchsia-400" />
          <p className="font-bold text-white">DM message</p>
        </div>
        <p className="text-white/40 text-sm">
          Use <code className="text-violet-300 bg-violet-500/10 px-1 rounded">{"{{storefront_url}}"}</code> to insert your link.
        </p>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/50 rounded-xl resize-none"
        />
        <p className="text-white/25 text-xs">
          Preview: {message.replace("{{storefront_url}}", `linktohub.vercel.app/${username}`)}
        </p>
      </div>

      {/* Enable toggle + save */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-white">AutoDM active</p>
          <p className="text-white/40 text-sm mt-0.5">Start responding to comments automatically</p>
        </div>
        <button
          onClick={() => setEnabled((v) => !v)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Toggle AutoDM"
        >
          {enabled
            ? <ToggleRight className="w-10 h-10 text-violet-500" />
            : <ToggleLeft className="w-10 h-10 text-white/30" />
          }
        </button>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full h-12 rounded-xl btn-gradient text-white font-bold text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
