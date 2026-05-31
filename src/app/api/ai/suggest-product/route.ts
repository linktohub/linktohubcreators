import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Merch Product Images ─────────────────────────────────────────────────────
// Premium brand-card design — looks like a real streetwear/creator product drop

const ITEM_ICONS: Record<string, string> = {
  hoodie: "H",
  sweatshirt: "S",
  tshirt: "T",
  shirt: "T",
  cap: "C",
  hat: "C",
  snapback: "C",
  jacket: "J",
  bag: "B",
  tote: "B",
  mug: "M",
  poster: "P",
  default: "★",
};

const ITEM_LABELS: Record<string, string> = {
  hoodie: "HOODIE",
  sweatshirt: "CREWNECK",
  tshirt: "TEE",
  shirt: "TEE",
  cap: "CAP",
  hat: "HAT",
  snapback: "SNAPBACK",
  jacket: "JACKET",
  bag: "TOTE BAG",
  tote: "TOTE BAG",
  mug: "MUG",
  poster: "POSTER",
  default: "MERCH",
};

function svgMerchImage(color: string, itemType: string, label: string): string {
  const typeKey = (itemType || "tshirt").toLowerCase().replace(/[\s\-_]/g, "");
  const c = color || "#7c3aed";
  const itemLabel = ITEM_LABELS[typeKey] || ITEM_LABELS[Object.keys(ITEM_LABELS).find(k => typeKey.includes(k)) || "default"] || "MERCH";
  const letter = itemLabel.charAt(0);
  const brandName = (label || "").substring(0, 14).toUpperCase();

  // Parse hex color to components for background
  const hex = c.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const darkBg = `rgb(${Math.round(r * 0.06)},${Math.round(g * 0.06)},${Math.round(b * 0.08)})`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${darkBg}"/>
        <stop offset="100%" stop-color="#08080f"/>
      </linearGradient>
      <linearGradient id="block" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c}"/>
        <stop offset="100%" stop-color="${c}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="400" height="400" fill="url(#bg)"/>
    <!-- Color block - top 55% -->
    <rect x="0" y="0" width="400" height="220" fill="url(#block)"/>
    <!-- Diagonal slice -->
    <polygon points="0,200 400,220 400,240 0,240" fill="${darkBg}" opacity="0.3"/>
    <!-- Corner accent -->
    <rect x="0" y="0" width="8" height="220" fill="white" opacity="0.15"/>
    <rect x="0" y="0" width="400" height="6" fill="white" opacity="0.15"/>
    <!-- Product category label - top left -->
    <text x="28" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="800" fill="white" opacity="0.6" letter-spacing="4">${itemLabel}</text>
    <!-- Large focal letter -->
    <text x="200" y="175" font-family="Georgia,serif" font-size="168" font-weight="900" text-anchor="middle" fill="white" opacity="0.12">${letter}</text>
    <text x="200" y="175" font-family="Georgia,serif" font-size="168" font-weight="900" text-anchor="middle" fill="white" opacity="0.88">${letter}</text>
    <!-- Horizontal rule -->
    <rect x="28" y="238" width="344" height="1" fill="${c}" opacity="0.4"/>
    <!-- Brand name -->
    <text x="28" y="272" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="1">${brandName || "LIMITED DROP"}</text>
    <!-- Sub text -->
    <text x="28" y="298" font-family="system-ui,-apple-system,sans-serif" font-size="12" fill="white" opacity="0.4" letter-spacing="2">EXCLUSIVE MERCH</text>
    <!-- Dot decoration -->
    <circle cx="372" cy="360" r="32" fill="${c}" opacity="0.15"/>
    <circle cx="372" cy="360" r="20" fill="${c}" opacity="0.2"/>
    <!-- linktohub label -->
    <text x="28" y="380" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="white" opacity="0.2" letter-spacing="1">linktohub</text>
    <text x="372" y="366" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="800" text-anchor="middle" fill="${c}" opacity="0.9">NEW</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}


function brandedImage(color: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${color}" stop-opacity="1"/><stop offset="100%" stop-color="${color}" stop-opacity="0.55"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="230" font-family="system-ui,sans-serif" font-size="160" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ─── Creator context builder ───────────────────────────────────────────────────

function buildCreatorContext(creator: {
  display_name: string | null;
  niche: string | null;
  bio: string | null;
  audience_size: string | null;
  content_types: string[] | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  location_country: string | null;
  location_city: string | null;
}): string {
  const parts: string[] = [];
  parts.push(`Creator name: ${creator.display_name || "Unknown"}`);
  if (creator.niche) parts.push(`Niche: ${creator.niche}`);
  if (creator.bio) parts.push(`Bio: ${creator.bio}`);
  if (creator.audience_size) parts.push(`Audience size: ${creator.audience_size}`);
  if (creator.content_types?.length) parts.push(`Content types: ${creator.content_types.join(", ")}`);
  const socials: string[] = [];
  if (creator.instagram_url) socials.push(`Instagram (@${creator.instagram_url.replace("@", "")})`);
  if (creator.tiktok_url) socials.push(`TikTok (@${creator.tiktok_url.replace("@", "")})`);
  if (creator.youtube_url) socials.push("YouTube");
  if (creator.twitter_url) socials.push(`X/Twitter (@${creator.twitter_url.replace("@", "")})`);
  if (socials.length) parts.push(`Active platforms: ${socials.join(", ")}`);
  if (creator.location_city || creator.location_country) {
    parts.push(`Location: ${[creator.location_city, creator.location_country].filter(Boolean).join(", ")}`);
  }
  return parts.join("\n");
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildPrompt(
  type: string,
  ctx: string,
  niche: string,
  feedback?: string,
  previousData?: unknown
): string {
  const refinement = feedback && previousData
    ? `\n\nPrevious version:\n${JSON.stringify(previousData, null, 2)}\n\nCreator feedback: "${feedback}"\nRefine based on the feedback. Keep what works, change what they asked.`
    : "";

  if (type === "merch") {
    return `You are a product designer creating branded merch.

Creator profile:
${ctx}

Generate 1 standout merch product idea for this specific creator. Make it feel authentic to who they are.
Return ONLY valid JSON:
{
  "title": "Product name that fits their brand",
  "description": "2-3 sentences that sell this to their fans",
  "price": 39.99,
  "pod_provider": "gelato",
  "emoji": "👕",
  "item_type": "hoodie"
}
item_type must be one of: hoodie, t-shirt, cap, sweatshirt, jacket, bag, mug${refinement}`;
  }

  if (type === "course") {
    return `You are a course creator helping build an online course.

Creator profile:
${ctx}

Generate a complete course that plays to their specific strengths and audience. Return ONLY valid JSON:
{
  "title": "Course title",
  "description": "3-4 sentences. What transformation does the student get? Be specific to their niche.",
  "price": 97,
  "modules": [
    {"title": "Module 1: Title", "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"]},
    {"title": "Module 2: Title", "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"]},
    {"title": "Module 3: Title", "lessons": ["Lesson 1", "Lesson 2", "Lesson 3"]},
    {"title": "Module 4: Title", "lessons": ["Lesson 1", "Lesson 2"]},
    {"title": "Module 5: Title", "lessons": ["Lesson 1", "Lesson 2"]}
  ],
  "what_you_get": ["Specific benefit 1", "Specific benefit 2", "Specific benefit 3", "Specific benefit 4"],
  "emoji": "🎓"
}
Make modules actionable and specific to ${niche}.${refinement}`;
  }

  if (type === "pdf") {
    return `Create a PDF guide for this creator's audience.

Creator profile:
${ctx}

Make it highly specific to their niche and what their audience would actually pay for. Return ONLY valid JSON:
{
  "title": "Guide title",
  "description": "What's inside and the exact transformation the reader gets",
  "price": 27,
  "pages": 25,
  "sections": [
    "Section 1: [specific title]",
    "Section 2: [specific title]",
    "Section 3: [specific title]",
    "Section 4: [specific title]",
    "Section 5: [specific title]",
    "Section 6: [specific title]"
  ],
  "section_content": {
    "Section 1: [title]": "2-3 sentence summary of what this section covers",
    "Section 2: [title]": "2-3 sentence summary"
  },
  "emoji": "📄"
}${refinement}`;
  }

  if (type === "preset") {
    return `Create a preset/template pack for this creator.

Creator profile:
${ctx}

Return ONLY valid JSON:
{
  "title": "Pack name",
  "description": "What's included and the transformation",
  "price": 37,
  "count": 15,
  "items": ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
  "emoji": "🎨"
}${refinement}`;
  }

  if (type === "event") {
    return `Create a live event for this creator.

Creator profile:
${ctx}

Make it something their specific audience would pay to attend. Return ONLY valid JSON:
{
  "title": "Event title",
  "description": "3-4 sentences on what attendees will learn and why they must attend",
  "type": "webinar",
  "price": 47,
  "duration_minutes": 90,
  "max_attendees": 100,
  "days_from_now": 21,
  "emoji": "💻"
}
type must be one of: webinar, zoom, seminar, livestream, in_person${refinement}`;
  }

  if (type === "subscription") {
    return `Create a fan membership tier for this creator.

Creator profile:
${ctx}

Make the perks ultra specific to what this creator can actually deliver. Return ONLY valid JSON:
{
  "name": "Tier name (e.g. Inner Circle, VIP, Founding Member)",
  "description": "1-2 sentences on what makes this membership special",
  "price_monthly": 19,
  "perks": ["Specific perk 1", "Specific perk 2", "Specific perk 3", "Specific perk 4", "Specific perk 5"],
  "emoji": "⭐"
}
Price $5-$99/mo. Perks must match ${niche}.${refinement}`;
  }

  if (type === "booking") {
    return `Create a 1-on-1 booking service for this creator.

Creator profile:
${ctx}

What specific expertise can they sell directly to their audience? Return ONLY valid JSON:
{
  "title": "Session title",
  "description": "2-3 sentences on what you cover and who it's for",
  "price": 150,
  "duration_minutes": 60,
  "emoji": "📅"
}${refinement}`;
  }

  return "";
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, feedback, previousData } = await req.json();

  const { data: creator } = await supabase.from("creators")
    .select("display_name, username, niche, brand_color, bio, audience_size, content_types, instagram_url, tiktok_url, youtube_url, twitter_url, location_country, location_city")
    .eq("user_id", user.id).single();

  if (!creator) return NextResponse.json({ error: "No creator" }, { status: 404 });

  const color = creator.brand_color || "#7c3aed";
  const niche = creator.niche || "general creator";
  const ctx = buildCreatorContext(creator);
  const prompt = buildPrompt(type, ctx, niche, feedback, previousData);

  if (!prompt) return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Generation failed" }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);

    // Merch gets real clothing SVG; everything else gets branded emoji card
    if (type === "merch") {
      data.image = svgMerchImage(color, data.item_type || "tshirt", creator.display_name || "");
    } else {
      data.image = brandedImage(color, data.emoji || "📦");
    }

    return NextResponse.json({ data, type });
  } catch (err) {
    console.error("Suggest product error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
