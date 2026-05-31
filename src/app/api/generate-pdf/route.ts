import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, title, description, file_type, metadata, creators(display_name, niche, brand_color)")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const creator = product.creators as { display_name?: string; niche?: string; brand_color?: string } | null;
  const meta = product.metadata as { sections?: string[]; pages?: number; modules?: { title: string; lessons: string[] }[] } | null;
  const isCourse = product.file_type === "course";

  // Generate content with Claude — compact prompt for speed
  let sectionContents: { heading: string; body: string }[] = [];

  try {
    const items = isCourse
      ? (meta?.modules || []).flatMap((m) => m.lessons.map((l) => `${m.title}: ${l}`)).slice(0, 12)
      : (meta?.sections || []).slice(0, 8);

    if (items.length === 0) {
      items.push(...["Introduction", "Key Concepts", "How to Apply This", "Next Steps"]);
    }

    const prompt = `Write a complete ${isCourse ? "course" : "PDF guide"} titled "${product.title}" by ${creator?.display_name || "the creator"}.

For each section below, write 2 paragraphs of specific, actionable, valuable content:
${items.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Creator niche: ${creator?.niche || "general"}
Description: ${product.description || ""}

Return ONLY valid JSON:
{"sections":[{"heading":"Section title","body":"Two paragraphs of real, specific content here."}]}`;

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      sectionContents = parsed.sections || [];
    }
  } catch (err) {
    console.error("Content gen error:", err);
    // Fall back to section titles only
    const fallbackSections = meta?.sections || meta?.modules?.map((m) => m.title) || ["Content"];
    sectionContents = fallbackSections.map((s) => ({
      heading: s,
      body: `This section covers ${s} in detail. ${product.description || ""}`,
    }));
  }

  // Build PDF
  try {
    const pdfDoc = await PDFDocument.create();
    const W = 612;
    const H = 792;
    const M = 72;

    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Brand color
    const hex = (creator?.brand_color || "#7c3aed").replace("#", "");
    const br = parseInt(hex.slice(0, 2), 16) / 255;
    const bg = parseInt(hex.slice(2, 4), 16) / 255;
    const bb = parseInt(hex.slice(4, 6), 16) / 255;
    const brand = rgb(br, bg, bb);
    const dark = rgb(0.08, 0.08, 0.1);

    // Wrap text helper
    function wrap(text: string, width: number, size: number, f: typeof fontReg): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > width && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    }

    // Cover page
    const cover = pdfDoc.addPage([W, H]);
    cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark });
    cover.drawRectangle({ x: 0, y: H * 0.45, width: W, height: H * 0.55, color: brand });
    cover.drawRectangle({ x: 0, y: H * 0.44, width: W, height: H * 0.02, color: rgb(1, 1, 1), opacity: 0.1 });
    cover.drawRectangle({ x: M - 16, y: 0, width: 5, height: H * 0.44, color: brand });

    // Title on cover
    const titleWords = (product.title || "Untitled").split(" ");
    let titleLine = "";
    const titleLines: string[] = [];
    for (const w of titleWords) {
      const test = titleLine ? `${titleLine} ${w}` : w;
      if (fontBold.widthOfTextAtSize(test, 28) > W - M * 2 && titleLine) {
        titleLines.push(titleLine);
        titleLine = w;
      } else {
        titleLine = test;
      }
    }
    if (titleLine) titleLines.push(titleLine);

    let ty = H * 0.78;
    for (const line of titleLines.slice(0, 4)) {
      cover.drawText(line, { x: M, y: ty, size: 28, font: fontBold, color: rgb(1, 1, 1) });
      ty -= 36;
    }

    if (product.description) {
      const descLines = wrap(product.description, W - M * 2, 12, fontReg).slice(0, 4);
      let dy = H * 0.62;
      for (const l of descLines) {
        cover.drawText(l, { x: M, y: dy, size: 12, font: fontReg, color: rgb(1, 1, 1), opacity: 0.75 });
        dy -= 17;
      }
    }

    cover.drawText(creator?.display_name?.toUpperCase() || "LINKTOHUB", { x: M, y: 100, size: 11, font: fontBold, color: brand });
    cover.drawText(`${sectionContents.length} sections  •  ${product.file_type === "course" ? "Video Course" : "PDF Guide"}`, { x: M, y: 78, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5) });
    cover.drawText("linktohub.vercel.app", { x: W - M - 120, y: 30, size: 9, font: fontItalic, color: rgb(0.35, 0.35, 0.35) });

    // Content pages
    for (const section of sectionContents) {
      const page = pdfDoc.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.99, 0.99, 0.99) });
      page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: brand });
      page.drawRectangle({ x: M - 16, y: 0, width: 3, height: H - 6, color: brand, opacity: 0.15 });

      // Heading
      const hLines = wrap(section.heading, W - M * 2, 18, fontBold).slice(0, 3);
      let hy = H - 56;
      for (const l of hLines) {
        page.drawText(l, { x: M, y: hy, size: 18, font: fontBold, color: rgb(0.08, 0.08, 0.12) });
        hy -= 24;
      }
      page.drawRectangle({ x: M, y: hy - 4, width: 60, height: 3, color: brand });

      // Body text
      const bodyLines = wrap(section.body, W - M * 2, 11.5, fontReg);
      let by = hy - 28;
      for (const l of bodyLines) {
        if (by < 60) break;
        page.drawText(l, { x: M, y: by, size: 11.5, font: fontReg, color: rgb(0.22, 0.22, 0.28) });
        by -= 17;
      }

      // Footer
      page.drawText(product.title || "", { x: M, y: 28, size: 8.5, font: fontReg, color: rgb(0.6, 0.6, 0.6) });
    }

    const pdfBytes = await pdfDoc.save();

    // Upload
    const { data: uploaded, error: upErr } = await admin.storage
      .from("products")
      .upload(`digital/${productId}/content.pdf`, Buffer.from(pdfBytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upErr) {
      console.error("Upload error:", upErr);
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from("products").getPublicUrl(uploaded.path);
    await admin.from("products").update({ file_url: publicUrl }).eq("id", productId);

    return NextResponse.json({ url: publicUrl, ok: true });
  } catch (err) {
    console.error("PDF build error:", err);
    return NextResponse.json({ error: `PDF generation failed: ${String(err)}` }, { status: 500 });
  }
}
