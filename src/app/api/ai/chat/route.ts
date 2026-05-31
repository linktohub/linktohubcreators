import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { creatorId, message, history } = await req.json();

  const supabase = await createClient();

  // Gate AI chat behind active fan subscription
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Subscribe to chat with this creator's AI", gate: true }, { status: 403 });
  }

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", session.user.id).single();
  if (profile) {
    const { data: sub } = await supabase.from("fan_subscriptions")
      .select("id").eq("creator_id", creatorId).eq("fan_id", profile.id).eq("status", "active").single();
    if (!sub) {
      return NextResponse.json({ error: "Subscribe to chat with this creator's AI", gate: true }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Subscribe to chat with this creator's AI", gate: true }, { status: 403 });
  }

  const [{ data: creator }, { data: brand }] = await Promise.all([
    supabase.from("creators").select("display_name, bio, niche").eq("id", creatorId).single(),
    supabase.from("creator_brand").select("brand_voice_description, faq, sample_content").eq("creator_id", creatorId).single(),
  ]);

  const systemPrompt = `You are ${creator?.display_name}'s AI assistant. You speak in their voice and represent their brand.

About ${creator?.display_name}:
${creator?.bio || "A content creator."}
Niche: ${creator?.niche || "General content"}

${brand?.brand_voice_description ? `Brand voice: ${brand.brand_voice_description}` : ""}
${brand?.sample_content?.length ? `Sample content: ${brand.sample_content.slice(0, 3).join("\n")}` : ""}
${brand?.faq?.length ? `FAQ:\n${(brand.faq as { q: string; a: string }[]).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}` : ""}

Keep responses short, friendly, and on-brand. If asked about booking, products, or services, encourage them to explore the storefront.`;

  const messages = [
    ...(history || []).map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" as const : "assistant" as const,
      content: m.text,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply });
}
