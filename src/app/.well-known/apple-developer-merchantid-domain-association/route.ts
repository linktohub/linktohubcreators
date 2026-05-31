import { NextResponse } from "next/server";

// Stripe hosts this file — fetch and serve for Apple Pay domain verification
export async function GET() {
  try {
    const res = await fetch(
      "https://stripe.com/files/apple-pay/apple-developer-merchantid-domain-association"
    );
    const text = await res.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new NextResponse("", { status: 404 });
  }
}
