import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: product } = await admin
    .from("products")
    .select("*, creators(display_name, niche, brand_color)")
    .eq("id", productId)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const creator = product.creators as { display_name?: string; niche?: string; brand_color?: string } | null;
  const metadata = product.metadata as {
    sections?: string[];
    pages?: number;
    modules?: { title: string; lessons: string[] }[];
  } | null;

  // Generate full content for each section/module using Claude
  const isGuide = product.file_type === "pdf";
  const isCourse = product.file_type === "course";

  let contentPrompt = "";
  if (isGuide && metadata?.sections) {
    contentPrompt = `Write a complete PDF guide titled "${product.title}" by ${creator?.display_name || "the creator"} (${creator?.niche || "creator"} niche).

For each section, write 3-4 paragraphs of real, valuable, actionable content. This should be a complete, professional guide that delivers real value.

Sections:
${metadata.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Description: ${product.description || ""}

Return ONLY a JSON object:
{
  "sections": [
    {
      "title": "Section title",
      "content": "Full 3-4 paragraph content for this section. Make it practical and specific."
    }
  ]
}`;
  } else if (isCourse && metadata?.modules) {
    contentPrompt = `Write complete lesson content for a course titled "${product.title}" by ${creator?.display_name || "the creator"} (${creator?.niche || "creator"} niche).

For each lesson, write 2-3 paragraphs of concrete, actionable content. This is a real course that students will learn from.

Modules and lessons:
${metadata.modules.map((m, i) => `Module ${i + 1}: ${m.title}\n${m.lessons.map((l, j) => `  Lesson ${j + 1}: ${l}`).join("\n")}`).join("\n\n")}

Description: ${product.description || ""}

Return ONLY a JSON object:
{
  "modules": [
    {
      "title": "Module title",
      "lessons": [
        {
          "title": "Lesson title",
          "content": "Complete 2-3 paragraph lesson content. Be specific and actionable."
        }
      ]
    }
  ]
}`;
  }

  let generatedContent: { sections?: { title: string; content: string }[]; modules?: { title: string; lessons: { title: string; content: string }[] }[] } = {};

  if (contentPrompt) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: contentPrompt }],
      });
      const text = msg.content[0].type === "text" ? msg.content[0].text : "";
      const match = text.match(/\{[\s\S]*\}/);
      if (match) generatedContent = JSON.parse(match[0]);
    } catch (err) {
      console.error("Content generation error:", err);
    }
  }

  // Build PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 60;
  const contentWidth = pageWidth - margin * 2;

  // Parse brand color
  const hex = (creator?.brand_color || "#7c3aed").replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const brandRgb = rgb(r, g, b);

  function addPage() {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    return page;
  }

  function wrapText(text: string, maxWidth: number, fontSize: number, fontObj: typeof font): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = fontObj.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Cover page
  const cover = addPage();
  cover.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.02, 0.02, 0.05) });
  cover.drawRectangle({ x: 0, y: pageHeight * 0.6, width: pageWidth, height: pageHeight * 0.4, color: brandRgb, opacity: 0.15 });
  cover.drawRectangle({ x: margin - 10, y: pageHeight * 0.35, width: 6, height: pageHeight * 0.28, color: brandRgb });

  const titleLines = wrapText(product.title, contentWidth - 20, 32, boldFont);
  let titleY = pageHeight * 0.7;
  for (const line of titleLines.slice(0, 3)) {
    cover.drawText(line, { x: margin, y: titleY, size: 32, font: boldFont, color: rgb(1, 1, 1) });
    titleY -= 40;
  }

  if (product.description) {
    const descLines = wrapText(product.description, contentWidth, 13, font);
    let descY = pageHeight * 0.5;
    for (const line of descLines.slice(0, 5)) {
      cover.drawText(line, { x: margin, y: descY, size: 13, font, color: rgb(0.7, 0.7, 0.7) });
      descY -= 18;
    }
  }

  cover.drawText(creator?.display_name || "Linktohub", { x: margin, y: 80, size: 12, font: boldFont, color: brandRgb });
  cover.drawText(`linktohub.vercel.app`, { x: margin, y: 60, size: 10, font, color: rgb(0.4, 0.4, 0.4) });

  // Content pages
  function writeSection(title: string, content: string) {
    const page = addPage();
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.97, 0.97, 0.99) });
    page.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: brandRgb });

    // Section title
    const titleLines = wrapText(title, contentWidth, 20, boldFont);
    let y = pageHeight - 60;
    for (const line of titleLines) {
      page.drawText(line, { x: margin, y, size: 20, font: boldFont, color: rgb(0.1, 0.1, 0.15) });
      y -= 28;
    }
    y -= 10;
    page.drawRectangle({ x: margin, y: y + 6, width: contentWidth, height: 2, color: brandRgb, opacity: 0.4 });
    y -= 20;

    // Content paragraphs
    const paragraphs = content.split("\n\n").filter(Boolean);
    for (const para of paragraphs) {
      const lines = wrapText(para.trim(), contentWidth, 11, font);
      for (const line of lines) {
        if (y < 80) break;
        page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0.2, 0.2, 0.25) });
        y -= 16;
      }
      y -= 12;
      if (y < 80) break;
    }

    // Page footer
    page.drawText(`${product.title}`, { x: margin, y: 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  }

  if (isGuide && generatedContent.sections) {
    for (const section of generatedContent.sections) {
      writeSection(section.title, section.content);
    }
  } else if (isCourse && generatedContent.modules) {
    for (const module of generatedContent.modules) {
      for (const lesson of module.lessons) {
        writeSection(`${module.title}: ${lesson.title}`, lesson.content);
      }
    }
  } else if (metadata?.sections) {
    for (const section of metadata.sections) {
      writeSection(section, `This section covers ${section}. Content is being developed by ${creator?.display_name || "the creator"}.`);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Upload to Supabase storage
  const path = `digital/${productId}/content.pdf`;
  const { data: uploaded, error: uploadError } = await admin.storage
    .from("products")
    .upload(path, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("products").getPublicUrl(uploaded.path);

  // Save URL back to product
  await admin.from("products").update({ file_url: publicUrl }).eq("id", productId);

  return NextResponse.json({ url: publicUrl, ok: true });
}
