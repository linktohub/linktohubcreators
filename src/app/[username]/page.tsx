import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StorefrontClient from "./storefront-client";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("display_name, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!creator) return { title: "Not Found" };

  return {
    title: `${creator.display_name} | Linktohub`,
    description: creator.bio || `${creator.display_name}'s creator storefront`,
    openGraph: {
      title: creator.display_name,
      description: creator.bio || "",
      images: creator.avatar_url ? [creator.avatar_url] : [],
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("username", username)
    .single();

  if (!creator) notFound();

  const [{ data: products }, { data: tiers }, { data: events }] = await Promise.all([
    supabase.from("products").select("*").eq("creator_id", creator.id).eq("active", true).order("sort_order"),
    supabase.from("subscription_tiers").select("*").eq("creator_id", creator.id).eq("active", true).order("price_monthly"),
    supabase.from("events").select("*").eq("creator_id", creator.id).eq("published", true).gte("starts_at", new Date().toISOString()).order("starts_at").limit(3),
  ]);

  return (
    <StorefrontClient
      creator={creator}
      products={products || []}
      tiers={tiers || []}
      events={events || []}
    />
  );
}
