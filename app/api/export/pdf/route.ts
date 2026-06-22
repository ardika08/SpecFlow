import { NextRequest, NextResponse } from "next/server";
import { generatePDF } from "@/lib/export/pdf";

// POST /api/export/pdf - Generate PDF from markdown
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markdown, title } = body;

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content is required" }, { status: 400 });
    }

    const pdfBlob = await generatePDF(markdown, title || "PRD");

    // Convert blob to base64 for response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `${(title || "prd").replace(/\s+/g, "-").toLowerCase()}.pdf`,
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
