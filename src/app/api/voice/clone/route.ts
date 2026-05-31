import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const creatorId = formData.get("creator_id") as string;
    const name = formData.get("name") as string || "Creator Voice";

    if (!audio || !creatorId) {
      return NextResponse.json({ error: "Missing audio or creator_id" }, { status: 400 });
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) {
      return NextResponse.json({ error: "Voice service unavailable" }, { status: 503 });
    }

    const elFormData = new FormData();
    elFormData.append("name", name);
    elFormData.append("description", `AI voice clone for ${name}`);
    elFormData.append("files", audio, audio.name || "voice.mp3");

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": elevenKey },
      body: elFormData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs error:", err);
      return NextResponse.json({ error: "Voice creation failed" }, { status: 500 });
    }

    const { voice_id } = await res.json();

    const supabase = await createClient();
    await supabase.from("creator_brand").upsert(
      { creator_id: creatorId, elevenlabs_voice_id: voice_id },
      { onConflict: "creator_id" }
    );

    return NextResponse.json({ voice_id });
  } catch (err) {
    console.error("Voice clone error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
