"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function GumroadCalculator() {
  const [revenue, setRevenue] = useState(1000);
  const [avgPrice, setAvgPrice] = useState(25);
  const [refundRate, setRefundRate] = useState(3);

  const r = Math.max(revenue, 0);
  const p = Math.max(avgPrice, 1);
  const rf = Math.max(refundRate, 0);

  const transactions = r / p;
  const stripeRate = 0.029;
  const stripePerTx = 0.30;

  const gumroadFee = r * 0.10 + transactions * 0.50;
  const gumroadStripeFee = r * stripeRate + transactions * stripePerTx;
  const gumroadRefundCost = r * (rf / 100) * 0.10;
  const gumroadNet = r - gumroadFee - gumroadStripeFee - gumroadRefundCost;

  const linktohubFee = r * 0.06;
  const linktohubStripeFee = r * stripeRate + transactions * stripePerTx;
  const linktohubNet = r - linktohubFee - linktohubStripeFee;

  const monthlyDiff = linktohubNet - gumroadNet;
  const annualDiff = monthlyDiff * 12;

  const gumroadEffective = r > 0 ? ((r - gumroadNet) / r) * 100 : 0;
  const linktohubEffective = r > 0 ? ((r - linktohubNet) / r) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <p className="font-bold text-white/60 text-xs uppercase tracking-widest">Your numbers</p>

        <div className="space-y-1.5">
          <label className="text-white/70 text-sm font-medium">Monthly Revenue</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
            <input
              type="number"
              min={0}
              value={revenue}
              onChange={(e) => setRevenue(Number(e.target.value))}
              className="w-full h-12 pl-8 pr-4 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/70 text-sm font-medium">Average Sale Price</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
            <input
              type="number"
              min={1}
              value={avgPrice}
              onChange={(e) => setAvgPrice(Number(e.target.value))}
              className="w-full h-12 pl-8 pr-4 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-white/70 text-sm font-medium">Refund Rate</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={refundRate}
              onChange={(e) => setRefundRate(Number(e.target.value))}
              className="w-full h-12 pl-4 pr-8 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">%</span>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <p className="text-red-400/70 text-xs font-bold uppercase tracking-widest mb-3">Gumroad</p>
          <p className="text-3xl font-black text-white mb-0.5">${fmt(gumroadNet)}</p>
          <p className="text-white/30 text-sm">monthly net</p>
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5 text-xs text-white/40">
            <div className="flex justify-between">
              <span>Platform fee (10%)</span>
              <span className="text-red-400">−${fmt(gumroadFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe fees</span>
              <span>−${fmt(gumroadStripeFee)}</span>
            </div>
            {gumroadRefundCost > 0 && (
              <div className="flex justify-between">
                <span>Refund cost</span>
                <span className="text-red-400">−${fmt(gumroadRefundCost)}</span>
              </div>
            )}
          </div>
          <p className="text-red-400 text-xs font-semibold mt-3">
            <TrendingDown className="w-3 h-3 inline mr-1" />
            {gumroadEffective.toFixed(1)}% effective rate
          </p>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/30 rounded-2xl p-5">
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Linktohub</p>
          <p className="text-3xl font-black text-white mb-0.5">${fmt(linktohubNet)}</p>
          <p className="text-white/30 text-sm">monthly net</p>
          <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5 text-xs text-white/40">
            <div className="flex justify-between">
              <span>Platform fee (6%)</span>
              <span className="text-violet-400">−${fmt(linktohubFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stripe fees</span>
              <span>−${fmt(linktohubStripeFee)}</span>
            </div>
          </div>
          <p className="text-violet-400 text-xs font-semibold mt-3">
            <TrendingUp className="w-3 h-3 inline mr-1" />
            {linktohubEffective.toFixed(1)}% effective rate
          </p>
        </div>
      </div>

      {/* Annual savings callout */}
      {annualDiff > 0 && (
        <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 border border-violet-500/30 rounded-2xl p-6 text-center">
          <p className="text-white/50 text-sm mb-1">You keep an extra</p>
          <p className="text-4xl font-black text-white mb-1">${fmt(annualDiff)}</p>
          <p className="text-violet-300 font-semibold text-sm">per year with Linktohub</p>
          <p className="text-white/30 text-xs mt-2">${fmt(monthlyDiff)}/month × 12</p>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/auth/signup"
        className="w-full h-14 rounded-xl btn-gradient text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
      >
        Start free — keep more of your money <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-center text-white/20 text-xs">14-day free trial · No credit card · 6% platform fee on Starter</p>
    </div>
  );
}
