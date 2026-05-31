import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // Look up affiliate code and redirect to signup with tracking
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("referrer_creator_id")
    .eq("referral_code", code)
    .single();

  const url = new URL("/auth/signup", request.url);
  if (affiliate) {
    url.searchParams.set("ref", code);
  }

  return NextResponse.redirect(url);
}
