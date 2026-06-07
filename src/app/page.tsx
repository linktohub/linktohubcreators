import Link from "next/link";
import type { Metadata } from "next";
import {
  ShoppingBag, FileText, Bot, Calendar, Ticket,
  Users, Heart, BarChart3, Lock, Mail, Link2, Zap, ArrowRight, Star, TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Linktohub — The AI That Runs Your Creator Business",
  description: "207 million creators. Only 4% earn $50K+. Linktohub is the AI that builds every product, ships your merch, and grows your revenue — while you create.",
  openGraph: {
    title: "Linktohub — Your creator business, running itself",
    description: "AI builds everything. One link. Every revenue stream.",
    url: "https://linktohub.vercel.app",
    siteName: "Linktohub",
    type: "website",
    images: [{ url: "https://linktohub.vercel.app/og.png", width: 1200, height: 630, alt: "Linktohub — AI-powered creator storefront" }],
  },
  twitter: { card: "summary_large_image", title: "Linktohub — Your creator business, running itself", description: "AI builds everything. One link. Every revenue stream.", images: ["https://linktohub.vercel.app/og.png"] },
};

const FEATURES = [
  { icon: ShoppingBag, label: "Merch", desc: "Ships globally. No inventory ever." },
  { icon: FileText, label: "Courses & PDFs", desc: "AI writes the content. You collect." },
  { icon: Bot, label: "Your AI Clone", desc: "Answers fans 24/7 in your voice." },
  { icon: Calendar, label: "Bookings", desc: "1-on-1 sessions at your price." },
  { icon: Ticket, label: "Events", desc: "Webinars, livestreams, seminars." },
  { icon: Users, label: "Memberships", desc: "Monthly fan tiers. Recurring MRR." },
  { icon: Heart, label: "Tips", desc: "One tap for fans to support you." },
  { icon: BarChart3, label: "Analytics", desc: "Know your audience deeply." },
  { icon: Lock, label: "Exclusive Content", desc: "Paywalled for subscribers." },
  { icon: Mail, label: "Email List", desc: "You own it. Not the algorithm." },
  { icon: Link2, label: "Affiliate Program", desc: "Earn 25% from creator referrals." },
  { icon: Zap, label: "Instant Payouts", desc: "Your money hits your bank auto." },
];

const COMPARED = [
  { name: "Stan.store", price: "$99/mo for email", limit: "No AI creation. No merch.", highlight: false },
  { name: "Gumroad", price: "10% fee every sale", limit: "No subscriptions. No events.", highlight: false },
  { name: "Linktree", price: "12% fee", limit: "Just links. No revenue tools.", highlight: false },
  { name: "Linktohub", price: "From $29/mo · 6% fee", limit: "AI builds everything. You approve.", highlight: true },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-violet-700/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 -left-60 w-[600px] h-[600px] rounded-full bg-fuchsia-700/[0.04] blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto w-full">
        <div className="text-xl font-black tracking-tight"><span className="gradient-text">link</span>tohub</div>
        <div className="flex items-center gap-2">
          <Link href="/pricing" className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors hidden sm:block">Pricing</Link>
          <Link href="/auth/login" className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="text-sm font-bold px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors">Start free</Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center px-6">

        {/* Hero */}
        <section className="w-full max-w-5xl mx-auto pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-10">
            <TrendingUp className="w-3.5 h-3.5" />
            207M creators. Only 4% earn $50K+. We fix that.
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-black tracking-tight leading-[0.9] mb-7">
            Your entire creator<br /><span className="gradient-text">business, running itself.</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/45 max-w-2xl mx-auto leading-relaxed mb-10">
            AI builds your products. Merch ships globally. Your AI talks to fans 24/7 in your voice. You just approve and collect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href="/auth/signup" className="btn-gradient h-14 px-9 rounded-2xl text-white font-bold text-base shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2">
              Create free storefront <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="h-14 px-9 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04] text-base font-medium transition-colors flex items-center justify-center">
              View pricing
            </Link>
          </div>
          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {["#7c3aed", "#ec4899", "#f97316", "#10b981", "#3b82f6"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050508]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-white/55 text-sm">
                <span className="text-white/80 font-semibold">500+ creators</span> already earning
              </p>
            </div>
          </div>
          <p className="text-white/25 text-sm">14-day free trial · No credit card · Your storefront live in 10 minutes</p>
        </section>

        {/* How it works */}
        <section className="w-full max-w-4xl mx-auto mb-20">
          <div className="bg-gradient-to-r from-violet-600/10 to-fuchsia-600/5 border border-violet-500/20 rounded-3xl p-10 text-center">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                { n: "01", t: "Tell us who you are", d: "Connect your socials. AI reads your brand, voice, and audience." },
                { n: "02", t: "AI builds everything", d: "Courses, merch, events, memberships — created automatically. You approve or refine." },
                { n: "03", t: "Share one link", d: "Fans buy everything from your storefront. Money hits your bank." },
              ].map((s) => (
                <div key={s.n}>
                  <p className="text-5xl font-black text-violet-400/25 mb-3">{s.n}</p>
                  <p className="font-black text-white text-base mb-2">{s.t}</p>
                  <p className="text-white/40 text-sm leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* vs competitors */}
        <section className="w-full max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-black text-center mb-10">Why creators switch</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {COMPARED.map((c) => (
              <div key={c.name} className={`rounded-2xl p-6 border ${c.highlight ? "bg-violet-500/10 border-violet-500/40" : "bg-white/[0.02] border-white/[0.06]"}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className={`font-bold ${c.highlight ? "text-white text-xl" : "text-white/50"}`}>{c.name}</p>
                  <p className={`text-sm font-bold ${c.highlight ? "text-violet-400" : "text-white/30"}`}>{c.price}</p>
                </div>
                <p className={`text-sm ${c.highlight ? "text-white/70" : "text-white/30"}`}>{c.limit}</p>
                {c.highlight && <div className="flex items-center gap-1.5 mt-3"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /><p className="text-yellow-400 text-xs font-semibold">Best value for creators</p></div>}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="w-full max-w-5xl mx-auto mb-20">
          <p className="text-white/25 text-sm font-medium uppercase tracking-widest mb-8 text-center">Every revenue stream in one place</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card-glass rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <p className="font-semibold text-sm text-white/90">{label}</p>
                <p className="text-xs text-white/30 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI Voice section */}
        <section className="w-full max-w-4xl mx-auto mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <Bot className="w-3.5 h-3.5" />
              No competitor does this
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Your audience, answered 24/7<br className="hidden sm:block" />
              <span className="gradient-text"> — in your voice</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Fans ask questions. Your AI answers, using your content, your tone, your FAQs. No extra work.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 md:p-8 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-black text-white text-sm shrink-0">JR</div>
              <div>
                <p className="font-bold text-white text-sm">Jake Ross Fitness AI</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-emerald-400/70 text-xs">Always online · Trained on Jake&apos;s content</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/50 shrink-0 mt-0.5">A</div>
                <div className="bg-white/[0.05] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-white/80 text-sm">What protein powder do you use? I&apos;ve tried 3 and hate them all 😅</p>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <div className="bg-gradient-to-br from-violet-600/25 to-fuchsia-600/25 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-white/90 text-sm">I&apos;ve been on Optimum Nutrition Gold Standard for years — vanilla mixes clean, no chalk. ~$50 for 5lbs on Amazon. Grab it 💪</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-black text-white text-[10px] shrink-0 mt-0.5">JR</div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/50 shrink-0 mt-0.5">M</div>
                <div className="bg-white/[0.05] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-white/80 text-sm">How many days should I train as a beginner?</p>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end">
                <div className="bg-gradient-to-br from-violet-600/25 to-fuchsia-600/25 border border-violet-500/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-white/90 text-sm">Start with 3 days/week — exactly what my Beginner Blueprint covers. Rest days are half the work when you&apos;re just starting 🔥</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-black text-white text-[10px] shrink-0 mt-0.5">JR</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/auth/signup" className="btn-gradient h-12 px-8 rounded-xl text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-violet-500/15">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Pricing preview */}
        <section className="w-full max-w-3xl mx-auto mb-20 text-center">
          <h2 className="text-4xl font-black mb-3">Simple pricing</h2>
          <p className="text-white/40 mb-10">We only make money when you make money.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { n: "Starter", p: "$29/mo", f: "6% fee", h: false },
              { n: "Pro", p: "$49/mo", f: "4.5% fee", h: true },
              { n: "Business", p: "$99/mo", f: "3% fee", h: false },
            ].map((pl) => (
              <div key={pl.n} className={`rounded-2xl p-5 border ${pl.h ? "bg-violet-500/10 border-violet-500/40" : "bg-white/[0.02] border-white/[0.06]"}`}>
                <p className="font-bold text-white">{pl.n}</p>
                <p className="text-2xl font-black text-white mt-1">{pl.p}</p>
                <p className={`text-xs mt-1 ${pl.h ? "text-violet-400" : "text-white/30"}`}>{pl.f}</p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">Compare all features →</Link>
        </section>

        {/* Final CTA */}
        <section className="w-full max-w-2xl mx-auto pb-24">
          <div className="card-glass rounded-3xl p-10 text-center glow-violet">
            <h2 className="text-4xl font-black mb-3">Your storefront.<br /><span className="gradient-text">Live in 10 minutes.</span></h2>
            <p className="text-white/40 mb-8">AI builds everything. You approve. Start earning today.</p>
            <Link href="/auth/signup" className="btn-gradient h-14 px-10 rounded-2xl text-white font-bold text-base shadow-lg shadow-violet-500/25 inline-flex items-center gap-2">
              Create free storefront <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-white/20 text-xs mt-4">14-day free trial · No credit card required</p>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Linktohub",
            "url": "https://linktohub.vercel.app",
            "description": "AI-powered creator monetization platform. Sell merch, courses, memberships, and more with one link.",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": { "@type": "Offer", "price": "29", "priceCurrency": "USD", "description": "Starter plan" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "124" },
          }),
        }}
      />

      <footer className="relative z-10 text-center py-8 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-6 text-white/20 text-sm">
          <Link href="/pricing" className="hover:text-white/40 transition-colors">Pricing</Link>
          <Link href="/auth/signup" className="hover:text-white/40 transition-colors">Sign up</Link>
          <Link href="/auth/login" className="hover:text-white/40 transition-colors">Sign in</Link>
        </div>
        <p className="text-white/15 text-xs mt-4">© 2026 Linktohub · The creator monetization OS</p>
      </footer>
    </div>
  );
}
