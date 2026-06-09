import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const creatorId = searchParams.get("state");

  if (!code || !creatorId) {
    return NextResponse.redirect(`${origin}/dashboard/autodm?error=missing_params`);
  }

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${origin}/api/autodm/ig-callback`;

  // Exchange code for short-lived token
  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/dashboard/autodm?error=token_exchange`);
  }

  const { access_token: shortToken, user_id: igUserId } = await tokenRes.json() as {
    access_token: string;
    user_id: string;
  };

  // Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
  );

  const longData = await longRes.json() as { access_token?: string };
  const finalToken = longData.access_token || shortToken;

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await admin.from("creators").update({
    ig_access_token: finalToken,
    ig_user_id: String(igUserId),
  }).eq("id", creatorId);

  return NextResponse.redirect(`${origin}/dashboard/autodm?connected=1`);
}
