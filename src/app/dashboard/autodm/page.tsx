import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Instagram } from "lucide-react";
import Link from "next/link";
import AutoDMClient from "./autodm-client";

export default async function AutoDMPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const { connected } = await searchParams;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("id, username, ig_access_token, ig_user_id, autodm_keyword, autodm_message, autodm_enabled")
    .eq("user_id", session.user.id)
    .single();
  if (!creator) redirect("/onboarding");

  return (
    <div className="p-5 pb-28 md:pb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">AutoDM</h1>
          <p className="text-white/40 mt-1 text-sm">Comment a keyword → auto-DM your link</p>
        </div>
      </div>

      {connected === "1" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Instagram className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 font-semibold text-sm">Instagram connected!</p>
        </div>
      )}

      <AutoDMClient
        creatorId={creator.id}
        username={creator.username}
        isConnected={!!creator.ig_access_token}
        initialKeyword={creator.autodm_keyword || "LINK"}
        initialMessage={creator.autodm_message || "Hey! Here's my store: {{storefront_url}}"}
        initialEnabled={creator.autodm_enabled || false}
      />
    </div>
  );
}
