import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const sig = req.nextUrl.searchParams.get("sig") || "";
  const secret = process.env.UNSUBSCRIBE_SECRET || "linktohub-unsub";
  const expected = createHmac("sha256", secret).update(email).digest("hex");

  if (!email || sig !== expected) {
    return new NextResponse("Invalid link", { status: 400 });
  }

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await admin.from("email_subscribers").update({ subscribed: false }).eq("email", email);

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
     <body style="font-family:sans-serif;text-align:center;padding:60px;background:#050508;color:#fff">
       <h2>You've been unsubscribed</h2>
       <p style="color:#888">You won't receive any more emails from this creator.</p>
     </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
