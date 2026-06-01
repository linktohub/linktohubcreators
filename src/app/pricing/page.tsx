import Link from "next/link";
import { Check, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Linktohub",
  description: "Start free. Upgrade when you're earning. Keep 100% of your brand.",
};

const PLANS = [
  {
    name: "Starter",
    price: 29,
    fee: "5%",
    badge: null,
    tagline: "Launch your store",
    color: "from-white/10 to-white/5",
    border: "border-white/10",
    features: [
      "AI builds all your products",
      "Unlimited products",
      "Merch via Gelato (global)",
      "Digital products + courses",
      "Events + bookings",
      "Fan subscriptions",
      "AI chat (members only)",
      "Analytics dashboard",
      "Email list capture",
      "5% transaction fee",
    ],
  },
  {
    name: "Pro",
    price: 49,
    fee: "3%",
    badge: "Most Popular",
    tagline: "Scale your revenue",
    color: "from-violet-600/20 to-fuchsia-600/10",
    border: "border-violet-500/40",
    features: [
      "Everything in Starter",
      "3% transaction fee (save 2%)",
      "Priority AI generation",
      "Custom domain",
      "Advanced analytics",
      "Affiliate program (earn 25%)",
      "Brand deal inbox",
      "Remove Linktohub branding",
      "Creator support priority",
      "Early access to features",
    ],
  },
  {
    name: "Business",
    price: 99,
    fee: "0%",
    badge: "For power creators",
    tagline: "Keep everything you earn",
    color: "from-fuchsia-600/15 to-violet-600/5",
    border: "border-fuchsia-500/30",
    features: [
      "Everything in Pro",
      "ZERO transaction fee",
      "White-label storefront",
      "Agency mode (manage 5 accounts)",
      "API access",
      "Dedicated success manager",
      "Custom AI training sessions",
      "Priority Gelato fulfillment",
      "Brand marketplace access",
      "Instant payouts",
    ],
  },
];

const FAQ = [
  { q: "Is there a free trial?", a: "Yes. 14 days free on any plan. No credit card required to start." },
  { q: "What is a transaction fee?", a: "When a fan buys something from your store, we take a small percentage. Starter: 5%, Pro: 3%, Business: 0%. We only make money when you make money." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your dashboard in one click." },
  { q: "What does the AI actually do?", a: "It reads your social media, understands your brand and audience, then creates your products, writes all the copy, sets prices, and publishes to your storefront. You just approve or give feedback." },
  { q: "Do I need a Gelato or Stripe account?", a: "No. We handle all of that for you. You just add your bank account to receive your payments." },
  { q: "How is this different from Stan.store?", a: "Stan charges $99/mo for email marketing. We include it. Stan has no AI product creation. We build every product for you. Stan has no merch. We ship merch globally." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-black tracking-tight">
          <span className="gradient-text">link</span>tohub
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="text-sm font-bold px-5 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-colors">
            Start free →
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            14-day free trial on every plan
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-5">
            Start free.<br />
            <span className="gradient-text">Keep what you earn.</span>
          </h1>
          <p className="text-white/45 text-xl max-w-2xl mx-auto">
            We only make money when you make money. One platform. Every revenue stream. AI does the work.
          </p>
        </div>

        {/* Comparison callout */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-12 max-w-3xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            <span className="text-white font-semibold">Stan.store charges $99/mo</span> for email marketing.
            <span className="text-emerald-400 font-semibold"> We include it at $29.</span>
            {" "}Stan has no merch, no AI product creation, no voice AI.
            <span className="text-violet-400 font-semibold"> We have all of it.</span>
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border bg-gradient-to-b ${plan.color} ${plan.border} p-8 flex flex-col`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="btn-gradient text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-white/50 text-sm font-medium mb-1">{plan.tagline}</p>
                <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                <div className="flex items-end gap-2 mt-3">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-white/40 text-sm mb-2">/month</span>
                </div>
                <p className="text-white/40 text-xs mt-1">{plan.fee} transaction fee</p>
              </div>

              <Link
                href="/auth/signup"
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-center mb-8 transition-all ${
                  plan.badge
                    ? "btn-gradient text-white shadow-lg shadow-violet-500/20"
                    : "bg-white/[0.08] text-white hover:bg-white/[0.12] border border-white/10"
                }`}
              >
                Start 14-day free trial
              </Link>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The math */}
        <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 rounded-3xl p-10 mb-20 text-center">
          <h2 className="text-3xl font-black mb-4">The math is simple</h2>
          <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
            A creator earning $2,000/month on Pro pays $49 + $60 (3% fee) = $109/mo.
            They're keeping $1,891. On Gumroad, they'd pay $200+ in fees.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { platform: "Gumroad", cost: "$200+/mo", note: "10% fees on $2K" },
              { platform: "Stan Pro", cost: "$99/mo", note: "+ Stripe fees, no merch" },
              { platform: "Linktohub Pro", cost: "$109/mo", note: "Everything included" },
            ].map((c) => (
              <div key={c.platform} className={`bg-white/[0.05] rounded-2xl p-4 ${c.platform === "Linktohub Pro" ? "border border-violet-500/40 bg-violet-500/10" : "border border-white/[0.07]"}`}>
                <p className="text-white/40 text-xs mb-1">{c.platform}</p>
                <p className={`text-xl font-black ${c.platform === "Linktohub Pro" ? "text-violet-400" : "text-white/50"}`}>{c.cost}</p>
                <p className="text-white/30 text-xs mt-1">{c.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl font-black text-center mb-10">Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                <p className="font-bold text-white mb-2">{item.q}</p>
                <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <h2 className="text-4xl font-black mb-4">Ready to start?</h2>
          <p className="text-white/40 mb-8">14 days free. No credit card. Cancel anytime.</p>
          <Link href="/auth/signup" className="btn-gradient h-14 px-10 rounded-2xl text-white font-bold text-base inline-flex items-center shadow-lg shadow-violet-500/25">
            Create your free storefront →
          </Link>
        </div>
      </div>
    </div>
  );
}
