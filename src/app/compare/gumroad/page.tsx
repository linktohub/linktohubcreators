import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import GumroadCalculator from "./calculator-client";

export const metadata: Metadata = {
  title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
  description: "Enter your monthly Gumroad sales to see the real effective fee rate and compare to alternatives.",
  openGraph: {
    title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
    description: "On $1,000/mo Gumroad takes ~$130. Linktohub at 6% takes $60. See the real numbers.",
    url: "https://linktohub.vercel.app/compare/gumroad",
    siteName: "Linktohub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gumroad Fee Calculator 2026 — See What You Actually Keep",
    description: "On $1,000/mo Gumroad takes ~$130. Linktohub at 6% takes $60. See the real numbers.",
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

        <div className="mt-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Fee breakdown</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="font-bold text-white/70 mb-2">Gumroad</p>
              <p className="text-white/40">10% platform fee</p>
              <p className="text-white/40">$0.50 per transaction</p>
              <p className="text-white/40">2.9% + $0.30 Stripe</p>
              <p className="text-red-400/60">Keeps fee on refunds</p>
              <p className="text-red-400 font-semibold mt-2">~13–20% effective</p>
            </div>
            <div>
              <p className="font-bold text-white/70 mb-2">Linktohub</p>
              <p className="text-white/40">6% platform fee</p>
              <p className="text-white/40">2.9% + $0.30 Stripe</p>
              <p className="text-white/40">No per-tx surcharge</p>
              <p className="text-white/40">No refund penalty</p>
              <p className="text-violet-400 font-semibold mt-2">~9% effective</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-8">
          Calculations use Gumroad&apos;s standard (non-Discover) rate. Discover adds 30%. Stripe fees are estimates for US cards.
        </p>
      </main>
    </div>
  );
}
