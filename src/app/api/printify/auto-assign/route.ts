import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getPrintifyProducts, getPrintifyProviders, getPrintifyVariants } from "@/lib/printify";

const ITEM_TYPE_QUERIES: Record<string, string> = {
  hoodie: "hoodie",
  sweatshirt: "sweatshirt",
  "t-shirt": "t-shirt",
  tshirt: "t-shirt",
  shirt: "t-shirt",
  cap: "hat",
  hat: "hat",
  snapback: "hat",
  jacket: "jacket",
  bag: "tote bag",
  tote: "tote bag",
  mug: "mug",
  poster: "poster",
  default: "t-shirt",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, itemType } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const query = ITEM_TYPE_QUERIES[itemType?.toLowerCase() || "default"] || ITEM_TYPE_QUERIES.default;

  try {
    const blueprints = await getPrintifyProducts(query);
    if (!blueprints.length) return NextResponse.json({ ok: true, assigned: false });

    const blueprint = blueprints[0];
    const providerIds = await getPrintifyProviders(blueprint.id);
    if (!providerIds.length) return NextResponse.json({ ok: true, assigned: false });

    const printProviderId = providerIds[0];
    const variants = await getPrintifyVariants(blueprint.id, printProviderId);
    if (!variants.length) return NextResponse.json({ ok: true, assigned: false });

    const variant = variants[0];

    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await admin.from("products").update({
      pod_provider: "printify",
      pod_product_id: String(blueprint.id),
      pod_variant_id: `${printProviderId}|${variant.id}`,
    }).eq("id", productId);

    return NextResponse.json({ ok: true, assigned: true, blueprintId: blueprint.id });
  } catch (err) {
    console.error("Printify auto-assign error:", err);
    return NextResponse.json({ ok: true, assigned: false });
  }
}
