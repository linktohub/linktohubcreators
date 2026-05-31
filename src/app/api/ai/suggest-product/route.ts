import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── SVG Clothing Illustrations ───────────────────────────────────────────────

function svgMerchImage(color: string, itemType: string, label: string): string {
  const type = (itemType || "tshirt").toLowerCase().replace(/[\s-_]/g, "");
  const c = color || "#7c3aed";
  const dark = c + "cc";
  const mid = c + "88";
  const light = c + "44";

  let shape = "";

  if (type.includes("hoodie") || type.includes("sweatshirt")) {
    shape = `
      <!-- Hoodie body -->
      <path d="M155,148 L118,82 L38,110 L60,178 L102,163 L102,328 L298,328 L298,163 L340,178 L362,110 L282,82 L245,148 Q225,128 200,125 Q175,128 155,148 Z" fill="${dark}"/>
      <!-- Hood shape -->
      <path d="M118,82 L108,64 Q135,28 200,26 Q265,28 292,64 L282,82 L245,148 Q225,128 200,125 Q175,128 155,148 Z" fill="${mid}"/>
      <!-- Hood lining -->
      <path d="M135,100 Q160,60 200,56 Q240,60 265,100 Q240,118 200,121 Q160,118 135,100 Z" fill="${light}"/>
      <!-- Kangaroo pocket -->
      <rect x="152" y="232" width="96" height="64" rx="10" fill="${mid}"/>
      <line x1="200" y1="232" x2="200" y2="296" stroke="${dark}" stroke-width="2"/>
      <!-- Cuffs -->
      <rect x="38" y="163" width="64" height="12" rx="6" fill="${mid}"/>
      <rect x="298" y="163" width="64" height="12" rx="6" fill="${mid}"/>
      <!-- Waistband -->
      <rect x="102" y="318" width="196" height="14" rx="7" fill="${mid}"/>`;
  } else if (type.includes("cap") || type.includes("hat") || type.includes("snapback")) {
    shape = `
      <!-- Crown -->
      <path d="M68,248 Q75,162 200,154 Q325,162 332,248 Z" fill="${dark}"/>
      <!-- Brim -->
      <ellipse cx="200" cy="250" rx="138" ry="26" fill="${mid}"/>
      <!-- Brim highlight -->
      <ellipse cx="200" cy="248" rx="138" ry="12" fill="${dark}"/>
      <!-- Front panel seam -->
      <path d="M200,164 Q200,165 200,248" stroke="${light}" stroke-width="2" fill="none"/>
      <!-- Eyelet left -->
      <circle cx="148" cy="192" r="5" fill="${light}"/>
      <!-- Eyelet right -->
      <circle cx="252" cy="192" r="5" fill="${light}"/>
      <!-- Button on top -->
      <circle cx="200" cy="156" r="10" fill="${mid}"/>
      <circle cx="200" cy="156" r="6" fill="${light}"/>
      <!-- Sweatband hint -->
      <path d="M68,248 Q75,256 200,260 Q325,256 332,248" stroke="${light}" stroke-width="2" fill="none"/>
      <!-- Bill underside -->
      <ellipse cx="160" cy="274" rx="68" ry="12" fill="${light}"/>`;
  } else if (type.includes("jacket") || type.includes("coat")) {
    shape = `
      <!-- Jacket body -->
      <path d="M155,128 L118,78 L38,106 L60,178 L102,163 L102,328 L298,328 L298,163 L340,178 L362,106 L282,78 L245,128 Q225,108 200,105 Q175,108 155,128 Z" fill="${dark}"/>
      <!-- Left lapel -->
      <path d="M155,128 Q175,108 200,105 L195,200 L152,240 Z" fill="${mid}"/>
      <!-- Right lapel -->
      <path d="M245,128 Q225,108 200,105 L205,200 L248,240 Z" fill="${mid}"/>
      <!-- Center zip/button line -->
      <line x1="200" y1="200" x2="200" y2="328" stroke="${light}" stroke-width="3"/>
      <!-- Chest pocket left -->
      <rect x="125" y="170" width="48" height="32" rx="5" fill="${mid}"/>
      <!-- Side pockets -->
      <rect x="118" y="248" width="56" height="40" rx="6" fill="${mid}"/>
      <rect x="226" y="248" width="56" height="40" rx="6" fill="${mid}"/>
      <!-- Collar -->
      <path d="M155,128 Q175,108 200,105 Q225,108 245,128 L238,148 Q225,138 200,136 Q175,138 162,148 Z" fill="${mid}"/>`;
  } else if (type.includes("bag") || type.includes("tote")) {
    shape = `
      <!-- Bag body -->
      <rect x="80" y="160" width="240" height="200" rx="12" fill="${dark}"/>
      <!-- Bag top flap -->
      <rect x="80" y="145" width="240" height="20" rx="6" fill="${mid}"/>
      <!-- Left handle -->
      <path d="M125,145 Q115,95 130,80 Q145,65 160,80 Q175,95 165,145" stroke="${mid}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <!-- Right handle -->
      <path d="M235,145 Q225,95 240,80 Q255,65 270,80 Q285,95 275,145" stroke="${mid}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <!-- Center pocket -->
      <rect x="140" y="210" width="120" height="90" rx="8" fill="${mid}"/>
      <!-- Pocket zipper line -->
      <line x1="152" y1="210" x2="248" y2="210" stroke="${light}" stroke-width="3"/>
      <!-- Brand patch area -->
      <rect x="168" y="228" width="64" height="38" rx="6" fill="${light}"/>`;
  } else if (type.includes("mug") || type.includes("cup")) {
    shape = `
      <!-- Mug body -->
      <rect x="110" y="130" width="180" height="210" rx="16" fill="${dark}"/>
      <!-- Mug rim -->
      <ellipse cx="200" cy="130" rx="90" ry="16" fill="${mid}"/>
      <!-- Mug base -->
      <ellipse cx="200" cy="338" rx="90" ry="16" fill="${mid}"/>
      <!-- Handle -->
      <path d="M290,175 Q340,175 340,230 Q340,285 290,285" stroke="${mid}" stroke-width="22" fill="none" stroke-linecap="round"/>
      <!-- Design area -->
      <rect x="135" y="185" width="130" height="100" rx="10" fill="${mid}"/>
      <!-- Steam lines -->
      <path d="M170,110 Q178,90 170,70" stroke="${light}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M200,105 Q208,85 200,65" stroke="${light}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M230,110 Q238,90 230,70" stroke="${light}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  } else {
    // Default: T-shirt
    shape = `
      <!-- T-shirt body -->
      <path d="M152,128 L120,78 L40,106 L62,176 L104,161 L104,326 L296,326 L296,161 L338,176 L360,106 L280,78 L248,128 Q226,108 200,105 Q174,108 152,128 Z" fill="${dark}"/>
      <!-- Collar -->
      <path d="M152,128 Q174,108 200,105 Q226,108 248,128 Q228,142 200,145 Q172,142 152,128 Z" fill="${mid}"/>
      <!-- Sleeve seams -->
      <line x1="104" y1="128" x2="104" y2="161" stroke="${light}" stroke-width="2"/>
      <line x1="296" y1="128" x2="296" y2="161" stroke="${light}" stroke-width="2"/>
      <!-- Cuffs -->
      <rect x="40" y="161" width="64" height="12" rx="6" fill="${mid}"/>
      <rect x="296" y="161" width="64" height="12" rx="6" fill="${mid}"/>
      <!-- Hem -->
      <rect x="104" y="316" width="192" height="12" rx="6" fill="${mid}"/>`;
  }

  const labelText = label ? label.substring(0, 18) : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#141420"/>
        <stop offset="100%" stop-color="#0d0d18"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="12" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <!-- Glow blob behind item -->
    <ellipse cx="200" cy="210" rx="140" ry="110" fill="${c}" opacity="0.12" filter="url(#glow)"/>
    <!-- Clothing illustration -->
    <g transform="translate(0, -10)" opacity="0.95">
      ${shape}
    </g>
    <!-- Creator label -->
    ${labelText ? `<text x="200" y="388" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="${c}" opacity="0.7" letter-spacing="2">${labelText.toUpperCase()}</text>` : ""}
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
