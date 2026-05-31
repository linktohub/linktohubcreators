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
    <!-- Category label top -->
    <text x="28" y="36" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="800" fill="white" opacity="0.55" letter-spacing="4">${itemLabel}</text>
    <!-- Creator brand name centered in color block -->
    <text x="200" y="130" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="white" opacity="0.5" letter-spacing="3">${brandName || "LIMITED"}</text>
    <!-- Product type icon area (minimal, geometric) -->
    <circle cx="200" cy="175" r="42" fill="white" opacity="0.08"/>
    <circle cx="200" cy="175" r="28" fill="white" opacity="0.1"/>
    <text x="200" y="188" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="900" text-anchor="middle" fill="white" opacity="0.85">${itemLabel.charAt(0)}</text>
    <!-- Divider -->
    <rect x="28" y="236" width="344" height="1" fill="white" opacity="0.15"/>
    <!-- Brand name in dark section -->
    <text x="28" y="268" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="900" fill="white">${brandName || "CREATOR MERCH"}</text>
    <!-- Item type -->
    <text x="28" y="292" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${c}" letter-spacing="2" font-weight="600">${itemLabel} · VIA GELATO</text>
    <!-- Quality dots -->
    <circle cx="28" cy="340" r="4" fill="${c}"/>
    <circle cx="44" cy="340" r="4" fill="${c}" opacity="0.6"/>
    <circle cx="60" cy="340" r="4" fill="${c}" opacity="0.3"/>
    <!-- NEW badge -->
    <rect x="316" y="326" width="56" height="26" rx="13" fill="${c}"/>
    <text x="344" y="344" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="white">NEW</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}


function brandedImage(color: string, type: string, title: string, creatorName: string): string {
  const c = color || "#7c3aed";
  const hex = c.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const dark = `rgb(${Math.round(r * 0.08)},${Math.round(g * 0.08)},${Math.round(b * 0.1)})`;

  // Type-specific design
  const configs: Record<string, { label: string; icon: string; shape: string }> = {
    course: {
      label: "ONLINE COURSE",
      icon: `<rect x="60" y="120" width="280" height="180" rx="8" fill="${c}" opacity="0.15"/>
             <rect x="60" y="120" width="280" height="4" fill="${c}"/>
             <rect x="80" y="144" width="200" height="10" rx="3" fill="white" opacity="0.6"/>
             <rect x="80" y="164" width="160" height="8" rx="3" fill="white" opacity="0.35"/>
             <rect x="80" y="180" width="180" height="8" rx="3" fill="white" opacity="0.35"/>
             <rect x="80" y="196" width="140" height="8" rx="3" fill="white" opacity="0.35"/>
             <rect x="80" y="216" width="170" height="8" rx="3" fill="white" opacity="0.25"/>
             <rect x="80" y="232" width="150" height="8" rx="3" fill="white" opacity="0.25"/>
             <circle cx="310" cy="270" r="20" fill="${c}"/>
             <polygon points="305,262 305,278 321,270" fill="white"/>`,
      shape: "",
    },
    pdf: {
      label: "PDF GUIDE",
      icon: `<rect x="110" y="90" width="180" height="230" rx="6" fill="white" opacity="0.08"/>
             <rect x="110" y="90" width="180" height="230" rx="6" fill="none" stroke="white" stroke-width="1.5" stroke-opacity="0.2"/>
             <rect x="125" y="110" width="150" height="12" rx="3" fill="${c}" opacity="0.8"/>
             <rect x="125" y="134" width="120" height="6" rx="2" fill="white" opacity="0.4"/>
             <rect x="125" y="150" width="140" height="6" rx="2" fill="white" opacity="0.25"/>
             <rect x="125" y="165" width="110" height="6" rx="2" fill="white" opacity="0.25"/>
             <rect x="125" y="190" width="130" height="6" rx="2" fill="white" opacity="0.2"/>
             <rect x="125" y="205" width="100" height="6" rx="2" fill="white" opacity="0.2"/>
             <rect x="125" y="220" width="120" height="6" rx="2" fill="white" opacity="0.2"/>
             <rect x="125" y="250" width="80" height="6" rx="2" fill="${c}" opacity="0.5"/>
             <path d="M270,90 L290,90 L290,110 Z" fill="${c}" opacity="0.6"/>`,
      shape: "",
    },
    preset: {
      label: "PRESET PACK",
      icon: `<rect x="60" y="110" width="100" height="100" rx="10" fill="${c}" opacity="0.7"/>
             <rect x="170" y="110" width="100" height="100" rx="10" fill="${c}" opacity="0.5"/>
             <rect x="280" y="110" width="60" height="100" rx="10" fill="${c}" opacity="0.3"/>
             <rect x="60" y="220" width="60" height="100" rx="10" fill="${c}" opacity="0.3"/>
             <rect x="130" y="220" width="100" height="100" rx="10" fill="${c}" opacity="0.5"/>
             <rect x="240" y="220" width="100" height="100" rx="10" fill="${c}" opacity="0.7"/>`,
      shape: "",
    },
    event: {
      label: "LIVE EVENT",
      icon: `<rect x="80" y="100" width="240" height="200" rx="12" fill="none" stroke="${c}" stroke-width="2"/>
             <rect x="80" y="100" width="240" height="50" rx="12" fill="${c}"/>
             <rect x="80" y="138" width="240" height="14" fill="${c}"/>
             <rect x="110" y="170" width="40" height="40" rx="4" fill="white" opacity="0.1"/>
             <rect x="160" y="170" width="40" height="40" rx="4" fill="white" opacity="0.15"/>
             <rect x="210" y="170" width="40" height="40" rx="4" fill="white" opacity="0.1"/>
             <rect x="260" y="170" width="40" height="40" rx="4" fill="${c}" opacity="0.4"/>
             <text x="130" y="196" font-family="system-ui" font-size="16" text-anchor="middle" fill="white" font-weight="bold">7</text>
             <text x="180" y="196" font-family="system-ui" font-size="16" text-anchor="middle" fill="white" font-weight="bold">8</text>
             <text x="230" y="196" font-family="system-ui" font-size="16" text-anchor="middle" fill="white" font-weight="bold">9</text>`,
      shape: "",
    },
    subscription: {
      label: "MEMBERSHIP",
      icon: `<circle cx="200" cy="170" r="80" fill="none" stroke="${c}" stroke-width="2" stroke-opacity="0.3"/>
             <circle cx="200" cy="170" r="60" fill="${c}" opacity="0.15"/>
             <text x="200" y="185" font-family="Georgia,serif" font-size="52" text-anchor="middle" fill="${c}" opacity="0.9">★</text>`,
      shape: "",
    },
    booking: {
      label: "1-ON-1 SESSION",
      icon: `<circle cx="200" cy="155" r="55" fill="${c}" opacity="0.2"/>
             <circle cx="200" cy="140" r="28" fill="${c}" opacity="0.6"/>
             <ellipse cx="200" cy="195" rx="45" ry="22" fill="${c}" opacity="0.4"/>`,
      shape: "",
    },
  };

  const cfg = configs[type] || configs.pdf;
  const titleShort = (title || "").substring(0, 28);
  const author = (creatorName || "").substring(0, 20).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${dark}"/>
    <rect x="0" y="0" width="400" height="6" fill="${c}" opacity="0.8"/>
    ${cfg.icon}
    <rect x="0" y="318" width="400" height="82" fill="${dark}" opacity="0.9"/>
    <rect x="0" y="318" width="400" height="1" fill="${c}" opacity="0.2"/>
    <text x="24" y="343" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="${c}" letter-spacing="3" opacity="0.8">${cfg.label}</text>
    <text x="24" y="365" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="800" fill="white">${titleShort}</text>
    <text x="24" y="387" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="white" opacity="0.35">${author}</text>
  </svg>`;

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
      data.image = brandedImage(color, type, data.title || data.name || "", creator.display_name || "");
    }

    return NextResponse.json({ data, type });
  } catch (err) {
    console.error("Suggest product error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
