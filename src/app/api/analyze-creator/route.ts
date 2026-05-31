import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creatorId, instagramHandle, tiktokHandle, youtubeHandle, bio, niche } = await req.json();

  // Build a rich profile from whatever data we have
  const socialContext = [
    instagramHandle && `Instagram: @${instagramHandle.replace("@", "")}`,
    tiktokHandle && `TikTok: @${tiktokHandle.replace("@", "")}`,
    youtubeHandle && `YouTube: ${youtubeHandle}`,
    bio && `Bio: ${bio}`,
    niche && `Niche/Category: ${niche}`,
  ].filter(Boolean).join("\n");

  const prompt = `You are a brand analyst and AI product strategist. Analyze this creator's profile and build a complete brand identity picture.

Creator profile:
${socialContext || "Limited profile info — use niche to make educated guesses"}

Based on this information, provide a deep analysis. Return ONLY valid JSON:

{
  "brand_personality": "2-3 sentences describing their personality, tone, and how they likely communicate with their audience",
  "aesthetic": "Their visual style and aesthetic (e.g. 'dark and edgy', 'clean and minimal', 'colorful and energetic')",
  "audience_profile": "Who their audience likely is — age range, interests, why they follow this creator",
  "content_strengths": ["strength 1", "strength 2", "strength 3"],
  "monetization_style": "How this creator should approach monetization — e.g. 'educational courses fit perfectly', 'merch is their strongest play'",
  "brand_voice": "Their likely tone of voice — formal, casual, inspirational, funny, educational, etc.",
  "top_product_opportunities": [
    {
      "type": "course",
      "title": "Specific course title tailored to them",
      "reason": "Why this fits their brand",
      "estimated_price": 97
    },
    {
      "type": "merch",
      "title": "Specific merch item",
      "reason": "Why fans would buy this",
      "estimated_price": 45
    },
    {
      "type": "membership",
      "title": "Membership tier name",
      "reason": "What exclusive content they can offer",
      "estimated_price": 19
    },
    {
      "type": "booking",
      "title": "1-on-1 session type",
      "reason": "What expertise fans would pay for",
      "estimated_price": 150
    },
    {
      "type": "pdf",
      "title": "PDF guide title",
      "reason": "What knowledge their audience needs",
      "estimated_price": 27
    }
  ],
  "suggested_bio": "An improved, punchy 2-sentence bio that sells who they are",
  "suggested_tagline": "5-7 word tagline for their storefront",
  "brand_color_suggestion": "Hex color that fits their aesthetic",
  "pricing_tier": "budget (under $30), mid ($30-100), premium ($100+) — what their audience will pay"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Analysis failed" }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);

    // Save analysis to creator_brand table
    if (creatorId) {
      await supabase.from("creator_brand").upsert({
        creator_id: creatorId,
        brand_voice_description: `${analysis.brand_personality}\n\nVoice: ${analysis.brand_voice}\nAesthetic: ${analysis.aesthetic}`,
      }, { onConflict: "creator_id" });

      // Update creator with suggested improvements
      if (analysis.brand_color_suggestion) {
        await supabase.from("creators").update({
          brand_color: analysis.brand_color_suggestion,
        }).eq("id", creatorId);
      }
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Creator analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
