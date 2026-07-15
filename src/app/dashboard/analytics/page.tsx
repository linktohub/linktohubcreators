import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { subDays, format } from "date-fns";
import AnalyticsCharts from "./charts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase
    .from("creators")
    .select("id, total_revenue, total_orders")
    .eq("user_id", user.id)
    .single();
  if (!creator) redirect("/onboarding");

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  // Fetch analytics events for last 30 days
  const [
    { data: pageViews },
    { data: recentOrders },
    { data: subscribers },
    { data: emailSubs },
    { data: purchaseEvents },
  ] = await Promise.all([
    supabase.from("analytics_events").select("created_at, event_type, country, device_type, referrer, utm_source, utm_medium")
      .eq("creator_id", creator.id).gte("created_at", thirtyDaysAgo),
    supabase.from("orders").select("created_at, total, status")
      .eq("creator_id", creator.id).gte("created_at", thirtyDaysAgo).eq("status", "paid"),
    supabase.from("fan_subscriptions").select("created_at, price_monthly")
      .eq("creator_id", creator.id).eq("status", "active"),
    supabase.from("email_subscribers").select("created_at").eq("creator_id", creator.id),
    supabase.from("analytics_events").select("utm_source, metadata")
      .eq("creator_id", creator.id).eq("event_type", "purchase").gte("created_at", thirtyDaysAgo),
  ]);

  // Build daily chart data for last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const label = format(date, "MMM d");

    const views = (pageViews || []).filter(
      (e) => format(new Date(e.created_at), "yyyy-MM-dd") === dateStr && e.event_type === "page_view"
    ).length;

    const revenue = (recentOrders || [])
      .filter((o) => format(new Date(o.created_at), "yyyy-MM-dd") === dateStr)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { date: label, views, revenue: revenue / 100 };
  });

  // Country breakdown
  const countryMap: Record<string, number> = {};
  (pageViews || []).filter((e) => e.country).forEach((e) => {
    countryMap[e.country!] = (countryMap[e.country!] || 0) + 1;
  });
  const topCountries = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  (pageViews || []).filter((e) => e.device_type).forEach((e) => {
    deviceMap[e.device_type!] = (deviceMap[e.device_type!] || 0) + 1;
  });
  const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }));

  // Referrer breakdown
  const refMap: Record<string, number> = {};
  (pageViews || []).filter((e) => e.referrer).forEach((e) => {
    const ref = e.referrer!.includes("instagram") ? "Instagram"
      : e.referrer!.includes("tiktok") ? "TikTok"
      : e.referrer!.includes("youtube") ? "YouTube"
      : e.referrer!.includes("twitter") ? "Twitter"
      : "Direct / Other";
    refMap[ref] = (refMap[ref] || 0) + 1;
  });
  const referrers = Object.entries(refMap).sort(([, a], [, b]) => b - a).slice(0, 5).map(([source, count]) => ({ source, count }));

  // UTM source attribution
  type UtmRow = { source: string; visits: number; sales: number; revenue: number };
  const utmMap: Record<string, UtmRow> = {};
  (pageViews || []).filter((e) => e.event_type === "page_view" && e.utm_source).forEach((e) => {
    const src = e.utm_source!;
    if (!utmMap[src]) utmMap[src] = { source: src, visits: 0, sales: 0, revenue: 0 };
    utmMap[src].visits += 1;
  });
  (purchaseEvents || []).filter((e) => e.utm_source).forEach((e) => {
    const src = e.utm_source!;
    if (!utmMap[src]) utmMap[src] = { source: src, visits: 0, sales: 0, revenue: 0 };
    utmMap[src].sales += 1;
    const meta = e.metadata as { amount?: number } | null;
    utmMap[src].revenue += meta?.amount || 0;
  });
  const utmSources = Object.values(utmMap).sort((a, b) => b.visits - a.visits).slice(0, 10);

  const mrr = (subscribers || []).reduce((sum, s) => sum + (s.price_monthly || 0), 0);

  const stats = {
    totalRevenue: creator.total_revenue || 0,
    totalOrders: creator.total_orders || 0,
    mrr,
    totalSubscribers: (subscribers || []).length,
    totalEmailSubs: (emailSubs || []).length,
    pageViews30d: (pageViews || []).filter((e) => e.event_type === "page_view").length,
  };

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-black">Analytics</h1>
          <p className="text-white/40 mt-1">Last 30 days</p>
        </div>
      </div>

      <AnalyticsCharts
        stats={stats}
        chartData={days}
        topCountries={topCountries}
        devices={devices}
        referrers={referrers}
        utmSources={utmSources}
      />
    </div>
  );
}
