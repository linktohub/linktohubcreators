import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Shield, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Beacons vs Linktohub — Who Owns Your Domain?",
  description: "Beacons charges a $70 domain transfer fee when you leave. Linktree shares your data with OpenAI. Linktohub gives you full ownership of your domain and data.",
  openGraph: {
    title: "Beacons vs Linktohub — Who Owns Your Domain?",
    description: "Beacons charges a $70 domain transfer fee when you leave. Linktree shares your data with OpenAI. Linktohub gives you full ownership of your domain and data — beacons alternatives 2026, linktree data privacy.",
    url: "https://linktohub.vercel.app/compare/ownership",
    siteName: "Linktohub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beacons vs Linktohub — Who Owns Your Domain?",
    description: "Beacons charges a $70 domain transfer fee when you leave. Linktree shares your data with OpenAI. Linktohub keeps both yours.",
  },
};

export default function OwnershipPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-violet-700/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 -left-60 w-[600px] h-[600px] rounded-full bg-fuchsia-700/[0.04] blur-[100px]" />
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

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <AlertTriangle className="w-3.5 h-3.5" />
            Two platforms holding creator assets hostage right now
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Your domain is yours.<br />
            <span className="gradient-text">Your data stays yours.</span>
          </h1>
          <p className="text-white/45 text-lg leading-relaxed">
            Two platforms are locking creators in — one charges to leave, one shares your audience data with AI companies. Here&apos;s what we do differently.
          </p>
        </div>

        {/* Section 1 — Beacons domain trap */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">The Beacons domain trap</p>
          </div>
          <h2 className="text-2xl font-black mb-4 leading-tight">Beacons owns your domain registrar access — not you.</h2>
          <div className="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>
              When you register a custom domain through Beacons, Beacons holds the registrar access under their account — not yours. Your name is on the domain, but you don&apos;t control where it points or when it transfers.
            </p>
            <p>
              <span className="text-red-300 font-semibold">If you ever want to leave, Beacons charges a $70 &ldquo;domain transfer processing fee.&rdquo;</span> Your domain. Their fee. Creators writing about this publicly in July 2026 reviews describe it as a hostage situation.
            </p>
            <div className="mt-5 pt-5 border-t border-white/[0.06] bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-violet-300 font-bold text-sm mb-1">How Linktohub handles it</p>
                  <p className="text-white/50 text-sm">We help you connect a domain you already own through a registrar you control (Namecheap, Google Domains, Cloudflare). You added it; you keep it. When you leave, you take it with you. Always. No transfer fee, no processing delay, no hostage.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Linktree OpenAI disclosure */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">The Linktree OpenAI disclosure</p>
          </div>
          <h2 className="text-2xl font-black mb-4 leading-tight">Linktree updated their Privacy Notice on July 5, 2026 to share your data with OpenAI — without explicit opt-in.</h2>
          <div className="space-y-4 text-white/60 text-sm leading-relaxed">
            <p>
              Section 14 (&ldquo;Generative AI&rdquo;) of Linktree&apos;s updated Privacy Notice allows them to share your profile picture, summarized bio, and engagement metrics with OpenAI in response to ChatGPT queries. The policy uses opt-out framing — you&apos;re in by default.
            </p>
            <p>
              <span className="text-red-300 font-semibold">For creators in fashion, beauty, coaching, and fitness, your visual identity and audience data is your brand.</span> You didn&apos;t consent to training AI models. You didn&apos;t agree to have ChatGPT summarize your profile from data Linktree extracted.
            </p>
            <div className="mt-5 pt-5 border-t border-white/[0.06] bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-violet-300 font-bold text-sm mb-1">How Linktohub handles it</p>
                  <p className="text-white/50 text-sm">We don&apos;t share your data with any AI provider. Your profile, your audience data, your content — they stay in Linktohub&apos;s database and go nowhere else. We use Anthropic&apos;s Claude API to power your storefront&apos;s AI chat, but we don&apos;t send your subscriber list, your profile, or your analytics to any third party.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — Linktohub position */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-8 text-center mb-8">
          <Shield className="w-10 h-10 text-violet-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">No lock-in. No data games.<br />No fees when you want to leave.</h2>
          <p className="text-white/45 text-sm mb-8 max-w-md mx-auto">
            Linktohub&apos;s position is simple: your domain, your subscriber list, your content, your analytics — they belong to you. We make money when you make money, not when you try to leave.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 h-14 px-8 rounded-xl btn-gradient text-white font-bold text-base shadow-lg shadow-violet-500/20"
          >
            Start for free — no credit card <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/20 text-xs mt-4">14-day free trial · Cancel anytime · Your data exports as CSV on request</p>
        </div>

        <p className="text-center text-white/20 text-xs">
          Beacons domain policy sourced from creator reviews and Beacons support documentation, July 2026. Linktree privacy update sourced from their Privacy Notice, Section 14, dated July 5, 2026.
        </p>
      </main>
    </div>
  );
}
