import Link from "next/link";
import {
  ShoppingBag, FileText, Bot, Calendar, Ticket,
  Users, Heart, BarChart3, Lock, Mail, Link2, Zap,
} from "lucide-react";

const FEATURES = [
  { icon: ShoppingBag, label: "Custom Merch", desc: "Print-on-demand globally" },
  { icon: FileText, label: "Digital Products", desc: "PDFs, presets, courses" },
  { icon: Bot, label: "AI Chat", desc: "Trained on your voice" },
  { icon: Calendar, label: "Bookings", desc: "1-on-1 sessions" },
  { icon: Ticket, label: "Events", desc: "Webinars & seminars" },
  { icon: Users, label: "Subscriptions", desc: "Fan membership tiers" },
  { icon: Heart, label: "Tips", desc: "Support button" },
  { icon: BarChart3, label: "Analytics", desc: "Deep audience insights" },
  { icon: Lock, label: "Exclusive Content", desc: "Paywalled for fans" },
  { icon: Mail, label: "Email List", desc: "Own your audience" },
  { icon: Link2, label: "Affiliate Program", desc: "Let fans sell for you" },
  { icon: Zap, label: "Instant Payouts", desc: "Stripe Connect" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-violet-700/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 -left-60 w-[600px] h-[600px] rounded-full bg-fuchsia-700/[0.04] blur-[100px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-indigo-700/[0.04] blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto w-full">
        <div className="text-xl font-black tracking-tight">
          <span className="gradient-text">link</span>tohub
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <button className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
              Log in
            </button>
          </Link>
          <Link href="/auth/signup">
            <button className="text-sm font-bold px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors">
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          The creator storefront built for scale
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl lg:text-[90px] font-black tracking-tight leading-[0.88] mb-7 max-w-4xl">
          One link.<br />
          <span className="gradient-text">Everything you sell.</span>
        </h1>

        {/* Sub */}
        <p className="text-lg sm:text-xl text-white/45 max-w-lg leading-relaxed mb-10">
          Merch, digital products, AI chat, bookings, subscriptions — all in one storefront your audience loves.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-24">
          <Link href="/auth/signup">
            <button className="btn-gradient h-14 px-9 rounded-xl text-white font-bold text-base shadow-lg shadow-violet-500/20">
              Start for free →
            </button>
          </Link>
          <Link href="/auth/login">
            <button className="h-14 px-9 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04] text-base font-medium transition-colors">
              Sign in
            </button>
          </Link>
        </div>

        {/* Feature grid */}
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-white/25 text-sm font-medium uppercase tracking-widest mb-8">Everything creators need</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="card-glass rounded-2xl p-5 text-left transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <p className="font-semibold text-sm text-white/90">{label}</p>
                <p className="text-xs text-white/30 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 w-full max-w-2xl mx-auto">
          <div className="card-glass rounded-3xl p-10 text-center glow-violet">
            <h2 className="text-3xl sm:text-4xl font-black mb-3">
              Ready to monetize<br />
              <span className="gradient-text">your audience?</span>
            </h2>
            <p className="text-white/40 mb-8">Set up your storefront in minutes. Free forever.</p>
            <Link href="/auth/signup">
              <button className="btn-gradient h-14 px-10 rounded-xl text-white font-bold text-base shadow-lg shadow-violet-500/25">
                Create your storefront →
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-white/[0.06]">
        <p className="text-white/20 text-sm">© 2026 Linktohub</p>
      </footer>
    </div>
  );
}
