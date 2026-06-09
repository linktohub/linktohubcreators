import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/email-broadcast";

function unsubscribeUrl(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || "linktohub-unsub";
  const sig = createHmac("sha256", secret).update(email).digest("hex");
  return `https://linktohub.vercel.app/api/email/unsubscribe?email=${encodeURIComponent(email)}&sig=${sig}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject || !body) return NextResponse.json({ error: "Subject and body required" }, { status: 400 });

  const { data: creator } = await supabase.from("creators").select("id, display_name, email").eq("user_id", session.user.id).single();
  if (!creator) return NextResponse.json({ error: "No creator" }, { status: 404 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: subscribers } = await admin.from("email_subscribers").select("email, full_name").eq("creator_id", creator.id).eq("subscribed", true);

  if (!subscribers?.length) return NextResponse.json({ sent: 0, failed: 0, skipped: "No subscribers" });

  const resend = getResendClient();
  if (!resend) return NextResponse.json({ sent: 0, failed: 0, skipped: "Email not configured — add RESEND_API_KEY to Vercel" });

  let sent = 0;
  let failed = 0;

  // Send in batches of 10 (Resend rate limit on free tier)
  const batches = [];
  for (let i = 0; i < subscribers.length; i += 10) {
    batches.push(subscribers.slice(i, i + 10));
  }

  for (const batch of batches) {
    await Promise.all(batch.map(async (sub) => {
      try {
        await resend.emails.send({
          from: `${creator.display_name} <updates@linktohub.com>`,
          to: sub.email,
          subject,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
            ${body.replace(/\n/g, "<br>")}
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee">
            <p style="color:#888;font-size:12px">You're receiving this from ${creator.display_name} via Linktohub. <a href="${unsubscribeUrl(sub.email)}" style="color:#888">Unsubscribe</a></p>
          </div>`,
        });
        sent++;
      } catch {
        failed++;
      }
    }));
    // Small delay between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
