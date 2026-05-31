"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingBag, Star, Users, Mail, Eye } from "lucide-react";

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  mrr: number;
  totalSubscribers: number;
  totalEmailSubs: number;
  pageViews30d: number;
};

type DayData = { date: string; views: number; revenue: number };
type Country = { country: string; count: number };
type Device = { device: string; count: number };
type Referrer = { source: string; count: number };

export default function AnalyticsCharts({
  stats,
  chartData,
  topCountries,
  devices,
  referrers,
}: {
  stats: Stats;
  chartData: DayData[];
  topCountries: Country[];
  devices: Device[];
  referrers: Referrer[];
}) {
  const STAT_CARDS = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, sub: "All time" },
    { label: "MRR", value: `$${stats.mrr.toFixed(2)}`, icon: DollarSign, sub: "Monthly recurring" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, sub: "All time" },
    { label: "Subscribers", value: stats.totalSubscribers, icon: Star, sub: "Active fans" },
    { label: "Email List", value: stats.totalEmailSubs, icon: Mail, sub: "Total subscribers" },
    { label: "Page Views", value: stats.pageViews30d, icon: Eye, sub: "Last 30 days" },
  ];

  const customTooltipStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/50 text-sm">{label}</p>
              <Icon className="w-4 h-4 text-white/30" />
            </div>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-white/30 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold mb-6">Page Views — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false}
              interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
            <Area type="monotone" dataKey="views" stroke="#ffffff" strokeWidth={2} fill="url(#viewsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold mb-6">Revenue — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false}
              interval={Math.floor(chartData.length / 6)} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false} width={40}
              tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
            <Bar dataKey="revenue" fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top countries */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Top Countries</h3>
          {topCountries.length > 0 ? (
            <div className="space-y-3">
              {topCountries.map(({ country, count }) => {
                const max = topCountries[0].count;
                return (
                  <div key={country}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{country}</span>
                      <span className="text-white/40">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 bg-white rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-white/30 text-sm">No data yet</p>}
        </div>

        {/* Devices */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Devices</h3>
          {devices.length > 0 ? (
            <div className="space-y-3">
              {devices.map(({ device, count }) => {
                const total = devices.reduce((a, d) => a + d.count, 0);
                return (
                  <div key={device}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70 capitalize">{device}</span>
                      <span className="text-white/40">{Math.round((count / total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 bg-white rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-white/30 text-sm">No data yet</p>}
        </div>

        {/* Traffic sources */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold mb-4">Traffic Sources</h3>
          {referrers.length > 0 ? (
            <div className="space-y-3">
              {referrers.map(({ source, count }) => {
                const max = referrers[0].count;
                return (
                  <div key={source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">{source}</span>
                      <span className="text-white/40">{count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div className="h-1.5 bg-white rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-white/30 text-sm">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
