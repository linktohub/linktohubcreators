import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { refCode, userId } = await req.json() as { refCode: string; userId: string };
  if (!refCode || !userId) return NextResponse.json({ ok: false });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: affiliate } = await admin
    .from("affiliates")
    .select("referrer_creator_id, referred_count")
    .eq("referral_code", refCode)
    .single();

  if (!affiliate) return NextResponse.json({ ok: false });

  await admin.from("affiliates")
    .update({ referred_count: (affiliate.referred_count || 0) + 1 })
    .eq("referral_code", refCode);

  await admin.from("affiliate_referrals").insert({
    referral_code: refCode,
    referrer_creator_id: affiliate.referrer_creator_id,
    referred_user_id: userId,
  });

  return NextResponse.json({ ok: true });
}
