import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", user.id).single();
  if (!creator) redirect("/onboarding");

  const [{ data: products }, { data: events }, { data: tiers }] = await Promise.all([
    supabase.from("products").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false }),
    supabase.from("events").select("*").eq("creator_id", creator.id).order("starts_at"),
    supabase.from("subscription_tiers").select("*").eq("creator_id", creator.id).order("price_monthly"),
  ]);

  return (
    <div className="p-5 md:p-8 pb-28 md:pb-8 max-w-4xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Products</h1>
          <p className="text-white/35 mt-1 text-sm">Everything you sell, in one place</p>
        </div>
        <Link
          href="/dashboard/products/create"
          className="flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Create with AI
        </Link>
      </div>

      <ProductsClient
        products={products || []}
        events={events || []}
        tiers={tiers || []}
      />
    </div>
  );
}
