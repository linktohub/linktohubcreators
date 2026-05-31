import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getGelatoProducts } from "@/lib/gelato";

// Maps common item types to Gelato search queries
const ITEM_TYPE_QUERIES: Record<string, string> = {
  hoodie: "hoodie unisex",
  sweatshirt: "sweatshirt unisex",
  "t-shirt": "t-shirt unisex",
  tshirt: "t-shirt unisex",
  shirt: "t-shirt unisex",
  cap: "cap snapback",
  hat: "cap snapback",
  snapback: "cap snapback",
  jacket: "jacket",
  bag: "tote bag",
  tote: "tote bag",
  mug: "mug",
  poster: "poster",
  default: "t-shirt unisex",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, itemType } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const query = ITEM_TYPE_QUERIES[itemType?.toLowerCase() || "default"] || ITEM_TYPE_QUERIES.default;

  try {
    const products = await getGelatoProducts(query);
    if (!products.length) return NextResponse.json({ ok: true, assigned: false });

    const product = products[0];
    const variant = product.variants?.[0];

    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await admin.from("products").update({
      pod_product_id: product.productUid,
      pod_variant_id: variant?.variantUid || null,
      pod_provider: "gelato",
    }).eq("id", productId);

    return NextResponse.json({ ok: true, assigned: true, productUid: product.productUid });
  } catch (err) {
    console.error("Gelato auto-assign error:", err);
    return NextResponse.json({ ok: true, assigned: false });
  }
}
