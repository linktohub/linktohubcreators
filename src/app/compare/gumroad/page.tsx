import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GumroadCalculator from "./calculator-client";

export const metadata: Metadata = {
  title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
  description: "On $1,000/month Gumroad takes $130–230 in fees. Linktohub is $29 flat. See the real numbers, the refund trap, and why email marketing matters.",
  openGraph: {
    title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
    description: "On $1,000/month Gumroad takes $130–230 in fees. Linktohub is $29 flat. See the real numbers, the refund trap, and why email marketing matters.",
    url: "https://linktohub.vercel.app/compare/gumroad",
    siteName: "Linktohub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
    description: "On $1,000/month Gumroad takes $130–230 in fees. Linktohub is $29 flat. See the real numbers, the refund trap, and why email marketing matters.",
  },
};

export default function GumroadComparePage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-violet-700/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] rounded-full bg-red-700/[0.04] blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-4xl mx-auto w-full">
        <Link href="/" className="text-xl font-black tracking-tight">
          <span className="gradient-text">link</span>tohub
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="text-sm font-bold px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors">Start free</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 pb-24">
        <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors mb-10 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Linktohub
        </Link>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            Gumroad charges up to 13%+ effective fee
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            How much is Gumroad<br />
            <span className="gradient-text">actually taking from you?</span>
          </h1>
          <p className="text-white/45 text-lg leading-relaxed">
            Gumroad&apos;s 10% platform fee + $0.50/transaction + Stripe + refund losses stack up fast. Enter your numbers to see the real cost.
          </p>
        </div>

        <GumroadCalculator />

        {/* Why Linktohub wins — ordered by impact */}
        <div className="mt-16 space-y-4">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Why Linktohub wins</p>

          {/* 1. Fee math */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400">01 — Fee math</p>
            <p className="font-black text-xl leading-snug">On $1,000/month: Gumroad takes $130–230. Linktohub: $29 flat.</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mt-4">
              <div>
                <p className="font-bold text-white/70 mb-2">Gumroad</p>
                <p className="text-white/40">10% platform fee</p>
                <p className="text-white/40">$0.50 per transaction</p>
                <p className="text-white/40">2.9% + $0.30 Stripe</p>
                <p className="text-red-400 font-semibold mt-2">~13–23% effective</p>
              </div>
              <div>
                <p className="font-bold text-white/70 mb-2">Linktohub</p>
                <p className="text-white/40">$29/mo flat plan</p>
                <p className="text-white/40">2.9% + $0.30 Stripe</p>
                <p className="text-white/40">No per-tx surcharge</p>
                <p className="text-violet-400 font-semibold mt-2">$29 + Stripe only</p>
              </div>
            </div>
          </div>

          {/* 2. Refund trap */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">02 — The refund trap</p>
            <p className="font-black text-xl leading-snug">Gumroad keeps their fee when you refund.</p>
            <p className="text-white/45 mt-3">Issue a $100 refund and you still owe Gumroad $10.50. You eat the loss; they don&apos;t. Linktohub has no refund penalty — if a buyer gets their money back, you owe nothing.</p>
          </div>

          {/* 3. Discover 30% */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">03 — Discover: 30%, no exceptions</p>
            <p className="font-black text-xl leading-snug">Put your product in Gumroad&apos;s marketplace and the fee jumps to 30%.</p>
            <p className="text-white/45 mt-3">Gumroad Discover charges a flat 30% on every sale made through their discovery feed. There&apos;s no cap, no opt-out once you&apos;re in. Linktohub doesn&apos;t take a marketplace cut.</p>
          </div>

          {/* 4. Email marketing */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">04 — Email marketing included</p>
            <p className="font-black text-xl leading-snug">Gumroad has no email marketing at any price point.</p>
            <p className="text-white/45 mt-3">Linktohub includes automated email drip sequences (D3 + D7), broadcast emails, and subscriber analytics at the base plan. Stan charges $99/mo for comparable automation. Beacons caps free accounts at 50 sends/month. Linktohub at $29/mo: unlimited sends, automated drip, zero per-send fees.</p>
          </div>
        </div>

        {/* What Gumroad improved in 2026 — intellectual honesty */}
        <div className="mt-8 bg-white/[0.015] border border-white/[0.05] rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">What Gumroad improved in 2026</p>
          <p className="text-white/50 text-sm leading-relaxed">
            To be fair: Gumroad shipped meaningful improvements this year. In June 2026 they launched daily payouts for eligible US accounts (previously 7-day cycles), communities for paid memberships, and installment payment plans. These are real additions. The fee math, the refund trap, and the missing email marketing haven&apos;t changed — but if those three don&apos;t matter for your use case, Gumroad is a legitimate option.
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          Calculations use Gumroad&apos;s standard (non-Discover) rate. Discover adds 30%. Stripe fees are estimates for US cards.
        </p>
      </main>
    </div>
  );
}
