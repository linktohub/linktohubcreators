import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id, approved } = await req.json();

  if (type === "product") {
    await supabase.from("products").update({ active: approved }).eq("id", id);
  } else if (type === "tier") {
    await supabase.from("subscription_tiers").update({ is_active: approved }).eq("id", id);
  } else if (type === "event") {
    await supabase.from("events").update({ published: approved }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
