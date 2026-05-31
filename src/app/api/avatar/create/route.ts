import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const creatorId = formData.get("creator_id") as string;
    const name = formData.get("name") as string || "Creator Avatar";

    if (!file || !creatorId) {
      return NextResponse.json({ error: "Missing file or creator_id" }, { status: 400 });
    }

    const heygenKey = process.env.HEYGEN_API_KEY;
    if (!heygenKey) {
      return NextResponse.json({ error: "Avatar service unavailable" }, { status: 503 });
    }

    // Upload the asset to HeyGen
    const uploadFormData = new FormData();
    uploadFormData.append("file", file, file.name || "avatar.jpg");

    const uploadRes = await fetch("https://upload.heygen.com/v1/asset", {
      method: "POST",
      headers: { "X-Api-Key": heygenKey },
      body: uploadFormData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("HeyGen upload error:", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: uploadData } = await uploadRes.json();
    const assetId = uploadData?.id;

    // Create instant avatar from the uploaded asset
    const createRes = await fetch("https://api.heygen.com/v2/photo_avatar", {
      method: "POST",
      headers: {
        "X-Api-Key": heygenKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_asset_id: assetId, name }),
    });

    let avatarId: string;

    if (createRes.ok) {
      const { data } = await createRes.json();
      avatarId = data?.avatar_id || assetId;
    } else {
      // Fall back to using asset ID as avatar reference
      avatarId = assetId;
    }

    const supabase = await createClient();
    await supabase.from("creator_brand").upsert(
      { creator_id: creatorId, heygen_avatar_id: avatarId },
      { onConflict: "creator_id" }
    );

    return NextResponse.json({ avatar_id: avatarId });
  } catch (err) {
    console.error("Avatar create error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
