import { NextRequest, NextResponse } from "next/server";
import { getGelatoProducts } from "@/lib/gelato";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || undefined;
  try {
    const products = await getGelatoProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
