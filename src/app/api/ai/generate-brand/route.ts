import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function brandedImage(color: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0.6"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="230" font-family="system-ui,sans-serif" font-size="160" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function POST(req: NextRequest) {
  const { creator } = await req.json();
  const color = creator.brand_color || "#7c3aed";

  const prompt = `You are a brand strategist for Linktohub, a creator monetization platform. Generate a complete brand and product catalog for this creator.

CREATOR PROFILE:
- Name: ${creator.display_name}
- Username: @${creator.username}
- Niche: ${creator.niche || "General creator"}
- Audience Size: ${creator.audience_size || "Unknown"}
- Content Types: ${creator.content_types?.join(", ") || "Various"}
- Location: ${[creator.location_city, creator.location_country].filter(Boolean).join(", ") || "Global"}
- Features: ${creator.features?.join(", ") || "All"}
- Bio: ${creator.bio || "None"}
- Instagram: ${creator.instagram_handle ? `@${creator.instagram_handle}` : "Not provided"}
- Brand color: ${color}
- Uploaded assets: ${creator.uploaded_file_names?.length ? creator.uploaded_file_names.join(", ") : "None"}

Return ONLY valid JSON, no markdown, no explanation:

{
  "bio": "2-3 sentence authentic creator bio",
  "tagline": "5-8 word punchy tagline",
  "storefront_headline": "Bold 4-7 word hero headline",
  "email_headline": "10-15 word email list CTA",
  "brand_color": "Hex color refined for their niche",
  "subscription_tiers": [
    {"name":"Entry tier (Fan/Supporter)","price":4.99,"description":"Who this is for","perks":["Perk 1","Perk 2","Perk 3"]},
    {"name":"Mid tier (VIP/Inner Circle)","price":14.99,"description":"Mid tier description","perks":["Perk 1","Perk 2","Perk 3","Perk 4"]},
    {"name":"Premium tier (Elite/Founding)","price":29.99,"description":"Top supporter tier","perks":["Perk 1","Perk 2","Perk 3","Perk 4","Perk 5","Perk 6"]}
  ],
  "product_ideas": [
    {"name":"Classic [Niche] Logo Tee","description":"Their signature tee with branded graphic","type":"merch","price":34.99,"emoji":"👕"},
    {"name":"Premium Branded Hoodie","description":"Cozy oversized hoodie with brand logo","type":"merch","price":64.99,"emoji":"🧥"},
    {"name":"Signature Mug","description":"Morning ritual mug with brand colors","type":"merch","price":24.99,"emoji":"☕"},
    {"name":"Snapback Cap","description":"Streetwear-ready cap with logo embroidery","type":"merch","price":32.99,"emoji":"🧢"},
    {"name":"Phone Case","description":"Slim hard case with branded graphic","type":"merch","price":22.99,"emoji":"📱"},
    {"name":"Canvas Tote Bag","description":"Heavy canvas tote with bold brand print","type":"merch","price":28.99,"emoji":"👜"},
    {"name":"Art Poster 18x24","description":"High-quality print for fan walls","type":"merch","price":19.99,"emoji":"🖼️"},
    {"name":"Sticker Pack (12-pack)","description":"Holographic vinyl die-cut stickers","type":"merch","price":14.99,"emoji":"🎨"},
    {"name":"[Niche] Complete Masterclass","description":"Full course: Module 1 — Foundations, Module 2 — Advanced tactics, Module 3 — Monetization & growth. Everything fans need to go from beginner to expert.","type":"digital","price":97.00,"emoji":"🎓"},
    {"name":"Script & Caption Pack","description":"50 done-for-you scripts and viral captions for ${creator.content_types?.[0] || "content"} creators. Plug and post.","type":"digital","price":27.00,"emoji":"📝"},
    {"name":"[Niche] Toolkit & Resource Guide","description":"Full reference guide with templates, tools, and frameworks. Everything in one place.","type":"digital","price":47.00,"emoji":"🛠️"}
  ],
  "event_idea": {
    "title":"[Niche] Masterclass: Live Session",
    "description":"A live 90-minute deep-dive with Q&A. Fans leave with an actionable game plan.",
    "type":"webinar",
    "price":49.00,
    "emoji":"🎤"
  },
  "ai_personality": "Complete AI chat system prompt (5-6 sentences): who the AI is, the creator's tone and voice, topics they know about, how they engage fans, catchphrases or signature style"
}

Be highly specific to their niche. Replace all [Niche] placeholders with the actual niche. Make product names and descriptions feel authentic and on-brand.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Generation failed" }, { status: 500 });

    const suggestions = JSON.parse(jsonMatch[0]);
    const finalColor = suggestions.brand_color || color;

    // Attach branded image data URIs to each product
    suggestions.product_ideas = (suggestions.product_ideas || []).map((p: { emoji?: string; image?: string; [key: string]: unknown }) => ({
      ...p,
      image: brandedImage(finalColor, p.emoji || "📦"),
    }));
    if (suggestions.event_idea) {
      suggestions.event_idea.image = brandedImage(finalColor, suggestions.event_idea.emoji || "🎤");
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Brand generation error:", err);
    return NextResponse.json({ error: "Failed to generate brand" }, { status: 500 });
  }
}
