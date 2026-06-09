import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keyword, message, enabled } = await req.json() as {
    keyword: string;
    message: string;
    enabled: boolean;
  };

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", session.user.id).single();
  if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("creators").update({
    autodm_keyword: keyword,
    autodm_message: message,
    autodm_enabled: enabled,
  }).eq("id", creator.id);

  return NextResponse.json({ ok: true });
}
