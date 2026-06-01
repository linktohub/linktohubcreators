"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingBag, FileText, Bot, Calendar,
  Ticket, Star, BarChart3, Settings, ExternalLink, DollarSign,
  MessageSquarePlus, Users, CreditCard,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Monetize",
    items: [
      { href: "/dashboard/products", label: "Products", icon: ShoppingBag },
      { href: "/dashboard/digital", label: "Digital", icon: FileText },
      { href: "/dashboard/subscriptions", label: "Subscriptions", icon: Star },
      { href: "/dashboard/payouts", label: "Earnings", icon: DollarSign },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
      { href: "/dashboard/events", label: "Events", icon: Ticket },
      { href: "/dashboard/ai", label: "AI", icon: Bot },
    ],
  },
  {
    label: "Grow",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/affiliate", label: "Affiliate", icon: Users },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquarePlus },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/billing", label: "Plan & Billing", icon: CreditCard },
      { href: "/dashboard/payouts", label: "Earnings", icon: DollarSign },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: ShoppingBag },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/ai", label: "AI", icon: Bot },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

type Creator = { username: string; display_name: string; avatar_url?: string };

export default function DashboardNav({ creator }: { creator: Creator }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col bg-[#09090e] border-r border-white/[0.06] z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.05]">
          <span className="text-xl font-black tracking-tight">
            <span className="gradient-text">link</span>tohub
          </span>
        </div>

        {/* Creator */}
        <div className="px-4 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-black shrink-0">
              {creator.display_name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-white/90">{creator.display_name}</p>
              <p className="text-white/30 text-xs">@{creator.username}</p>
            </div>
          </div>
          <Link
            href={`/${creator.username}`}
            target="_blank"
            className="flex items-center gap-1.5 mt-3 text-xs text-white/30 hover:text-violet-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View storefront
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 px-3 mb-1.5">{label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, label: itemLabel, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "nav-active"
                          : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-400" : "")} />
                      {itemLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090e]/95 backdrop-blur-xl border-t border-white/[0.06] z-40 flex items-center justify-around px-2 safe-area-bottom">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-all min-h-[52px] justify-center",
                isActive ? "text-violet-400" : "text-white/35 hover:text-white/60"
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
