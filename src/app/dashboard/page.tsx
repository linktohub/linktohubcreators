import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, ShoppingBag, Users, Package, ArrowRight, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import SuggestionsFeed from "@/components/dashboard/suggestions-feed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("*, products(count), fan_subscriptions(count)")
    .eq("user_id", user.id)
    .single();

  if (!creator) redirect("/onboarding");

  const firstName = creator.display_name?.split(" ")[0] || "Creator";
  const needsPayouts = !creator.stripe_account_enabled;

  const stats = [
    { label: "Total Revenue", value: `$${(creator.total_revenue || 0).toFixed(2)}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Orders", value: creator.total_orders || 0, icon: ShoppingBag, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Subscribers", value: creator.fan_subscriptions?.[0]?.count || 0, icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Products", value: creator.products?.[0]?.count || 0, icon: Package, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  ];

  const QUICK_ACTIONS = [
    { href: "/dashboard/products/new", label: "Add merch", icon: ShoppingBag },
    { href: "/dashboard/ai", label: "Train AI", icon: null, emoji: "🤖" },
    { href: "/dashboard/subscriptions/new", label: "Create tier", icon: Users },
    { href: "/dashboard/events/new", label: "New event", icon: null, emoji: "🎟️" },
  ];

  return (
    <div className="p-5 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto">
      {/* Stripe Connect banner — shown until bank account is connected */}
      {needsPayouts && (
        <Link href="/dashboard/payouts"
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 mb-6 group hover:bg-amber-500/15 transition-colors">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-300 text-sm">Add your bank account to receive payouts</p>
            <p className="text-amber-400/60 text-xs mt-0.5">Sales won't reach you until this is set up. Takes 2 minutes.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors shrink-0" />
        </Link>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">
          Hey, {firstName}
        </h1>
        <p className="text-white/35 mt-1 text-sm">Here&apos;s what&apos;s happening with your storefront.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-glass rounded-2xl p-5 group transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</p>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </div>
            <p className="text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Storefront card */}
      <div className="card-glass rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-fuchsia-600/5 pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Live</span>
            </div>
            <h3 className="font-bold text-white text-lg">Your storefront is live</h3>
            <p className="text-white/35 text-sm mt-0.5">Share this link with your audience to start earning</p>
          </div>
          <div className="flex items-center gap-3">
            <code className="bg-white/[0.06] border border-white/[0.08] px-4 py-2 rounded-xl text-sm text-white/70 font-mono max-w-[180px] truncate hidden sm:block">
              linktohub.com/{creator.username}
            </code>
            <Link
              href={`/${creator.username}`}
              target="_blank"
              className="flex items-center gap-1.5 btn-gradient text-white font-semibold px-4 py-2 rounded-xl text-sm"
            >
              Open <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI Suggestions Feed */}
      <SuggestionsFeed creatorId={creator.id} />

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, emoji }) => (
            <Link
              key={href}
              href={href}
              className="card-glass rounded-xl p-4 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                {emoji ? (
                  <span className="text-lg">{emoji}</span>
                ) : Icon ? (
                  <Icon className="w-4 h-4 text-white/40 group-hover:text-violet-400 transition-colors" />
                ) : null}
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{label}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

