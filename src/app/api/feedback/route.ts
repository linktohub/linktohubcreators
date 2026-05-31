import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, title, description, priority } = await req.json();
  if (!title || !description) return NextResponse.json({ error: "Title and description required" }, { status: 400 });

  const { data: creator } = await supabase.from("creators").select("id, display_name").eq("user_id", session.user.id).single();

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await admin.from("creator_feedback").insert({
    creator_id: creator?.id || null,
    creator_name: creator?.display_name || session.user.email,
    user_email: session.user.email,
    type,
    title,
    description,
    priority: priority || "medium",
    status: "open",
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", session.user.id).single();
  if (!creator) return NextResponse.json({ feedback: [] });

  const { data: feedback } = await supabase
    .from("creator_feedback")
    .select("*")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ feedback: feedback || [] });
}
