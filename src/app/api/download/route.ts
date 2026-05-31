import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: pt } = await admin
    .from("purchase_tokens")
    .select("*, products(file_url, title)")
    .eq("token", token)
    .single();

  if (!pt) return new NextResponse("Invalid or expired download link", { status: 404 });
  if (new Date(pt.expires_at) < new Date()) return new NextResponse("Download link expired", { status: 410 });
  if (pt.download_count >= pt.max_downloads) return new NextResponse("Download limit reached", { status: 403 });

  await admin.from("purchase_tokens").update({ download_count: pt.download_count + 1 }).eq("id", pt.id);

  const fileUrl = (pt.products as { file_url?: string } | null)?.file_url;
  if (!fileUrl) return new NextResponse("File not found", { status: 404 });

  if (fileUrl.includes("supabase")) {
    const pathMatch = fileUrl.match(/\/products\/(.+)$/);
    if (pathMatch) {
      const { data: signed } = await admin.storage.from("products").createSignedUrl(pathMatch[1], 3600);
      if (signed?.signedUrl) return NextResponse.redirect(signed.signedUrl);
    }
  }
  return NextResponse.redirect(fileUrl);
}
