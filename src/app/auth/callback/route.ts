import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const ref = searchParams.get("ref");

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: existing } = await admin.from("profiles").select("id").eq("user_id", session.user.id).single();
      if (!existing) {
        await admin.from("profiles").insert({
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || null,
        });
      }

      if (ref) {
        const { data: affiliate } = await admin
          .from("affiliates")
          .select("referrer_creator_id, referred_count")
          .eq("referral_code", ref)
          .single();
        if (affiliate) {
          await admin.from("affiliates")
            .update({ referred_count: (affiliate.referred_count || 0) + 1 })
            .eq("referral_code", ref);
          await admin.from("affiliate_referrals").insert({
            referral_code: ref,
            referrer_creator_id: affiliate.referrer_creator_id,
            referred_user_id: session.user.id,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
