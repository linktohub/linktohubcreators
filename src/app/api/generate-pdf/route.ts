import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { generateAndStorePdf } from "@/lib/pdf-generator";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const url = await generateAndStorePdf(productId, admin);
    if (!url) return NextResponse.json({ error: "Product not found or generation failed" }, { status: 404 });
    return NextResponse.json({ url, ok: true });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: `PDF generation failed: ${String(err)}` }, { status: 500 });
  }
}
