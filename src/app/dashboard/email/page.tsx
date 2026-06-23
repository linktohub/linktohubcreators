import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Mail, Users } from "lucide-react";
import Link from "next/link";
import EmailBroadcastClient from "./broadcast-client";

export default async function EmailPage() {
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key"
  );

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id, display_name").eq("user_id", session.user.id).single();
  if (!creator) redirect("/onboarding");

  const { data: subscribers, count } = await supabase
    .from("email_subscribers")
    .select("email, source, created_at", { count: "exact" })
    .eq("creator_id", creator.id)
    .eq("subscribed", true)
    .order("created_at", { ascending: false });

  const bySource = (subscribers || []).reduce<Record<string, number>>((acc, s) => {
    acc[s.source || "storefront"] = (acc[s.source || "storefront"] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-5 pb-28 md:pb-8 max-w-4xl mx-auto">
      {!emailConfigured && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-red-400 text-lg shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-red-300 text-sm">Email not configured</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              Add your <code className="bg-red-500/10 px-1 rounded">RESEND_API_KEY</code> to Vercel environment variables to enable email delivery. Until then, order confirmations, welcome emails, and broadcasts are silently skipped.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Email Marketing</h1>
          <p className="text-white/40 mt-1 text-sm">Stan charges $99/mo for this. Yours is included.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-violet-400" />
            <p className="text-white/40 text-xs uppercase tracking-wider">Total subscribers</p>
          </div>
          <p className="text-3xl font-black text-white">{count || 0}</p>
        </div>
        {Object.entries(bySource).map(([source, n]) => (
          <div key={source} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-2 capitalize">{source}</p>
            <p className="text-3xl font-black text-white">{n}</p>
          </div>
        ))}
      </div>

      {/* Compose + send */}
      <EmailBroadcastClient subscriberCount={count || 0} />

      {/* Subscriber list */}
      {subscribers && subscribers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Subscribers</h2>
            <a
              href={`data:text/csv;charset=utf-8,Email,Source,Date\n${subscribers.map((s) => `${s.email},${s.source},${new Date(s.created_at).toLocaleDateString()}`).join("\n")}`}
              download="subscribers.csv"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Export CSV →
            </a>
          </div>
          <div className="space-y-2">
            {subscribers.slice(0, 20).map((s) => (
              <div key={s.email} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <p className="text-sm text-white/70 font-mono">{s.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-white/30 bg-white/[0.05] px-2 py-0.5 rounded capitalize">{s.source}</span>
                  <p className="text-white/25 text-xs">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(count || 0) > 20 && (
              <p className="text-white/25 text-xs text-center pt-2">Showing 20 of {count} — export CSV to see all</p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!subscribers || subscribers.length === 0) && (
        <div className="text-center py-20 border border-white/[0.06] rounded-2xl">
          <Mail className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 font-semibold mb-2">No subscribers yet</p>
          <p className="text-white/25 text-sm">Fans join your list from your storefront's email capture form.</p>
        </div>
      )}
    </div>
  );
}
