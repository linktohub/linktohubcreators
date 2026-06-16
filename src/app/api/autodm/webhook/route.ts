import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

// GET — Instagram webhook verification challenge
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type IgCommentEntry = {
  id: string;
  changes: Array<{
    field: string;
    value: {
      from: { id: string };
      text: string;
      media: { id: string };
    };
  }>;
};

// POST — Instagram comment event → send DM if keyword matches
export async function POST(req: NextRequest) {
  const body = await req.json() as { object: string; entry: IgCommentEntry[] };

  if (body.object !== "instagram") {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "comments") continue;

      const commentText = (change.value?.text || "").trim().toUpperCase();
      const commenterId = change.value?.from?.id;
      if (!commenterId) continue;

      // Find which creator owns this media
      const mediaId = change.value?.media?.id;
      if (!mediaId) continue;

      // Look up creator by ig_user_id matching the entry id
      const { data: creator } = await admin
        .from("creators")
        .select("id, username, ig_access_token, ig_user_id, autodm_keyword, autodm_message, autodm_enabled")
        .eq("ig_user_id", entry.id)
        .eq("autodm_enabled", true)
        .single();

      if (!creator || !creator.ig_access_token) continue;

      const keyword = (creator.autodm_keyword || "LINK").toUpperCase();
      if (!commentText.includes(keyword)) continue;

      const storefrontUrl = `https://linktohub.vercel.app/${creator.username}`;
      const dmText = (creator.autodm_message || "Hey! Here's my store: {{storefront_url}}")
        .replace("{{storefront_url}}", storefrontUrl);

      // Send DM via Instagram Direct Message API
      await fetch(`https://graph.instagram.com/v21.0/${creator.ig_user_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${creator.ig_access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: commenterId },
          message: { text: dmText },
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
