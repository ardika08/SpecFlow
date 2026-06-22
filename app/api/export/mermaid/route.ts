import { NextRequest, NextResponse } from "next/server";
import { renderMermaidToSVG } from "@/lib/export/mermaid";

// POST /api/export/mermaid/svg - Render Mermaid to SVG
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { definition } = body;

    if (!definition) {
      return NextResponse.json({ error: "Mermaid definition is required" }, { status: 400 });
    }

    const svg = await renderMermaidToSVG(definition);

    return NextResponse.json({
      success: true,
      svg,
    });
  } catch (error) {
    console.error("Mermaid SVG export error:", error);
    return NextResponse.json({ error: "Failed to render Mermaid diagram" }, { status: 500 });
  }
}

// POST /api/export/mermaid/png - Render Mermaid to PNG
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const definition = searchParams.get("definition");

    if (!definition) {
      return NextResponse.json({ error: "Mermaid definition is required" }, { status: 400 });
    }

    // Note: svgToPNG requires browser environment (canvas)
    // This endpoint only returns SVG for server-side rendering
    // Client should handle PNG conversion
    const svg = await renderMermaidToSVG(definition);

    return NextResponse.json({
      success: true,
      svg,
      note: "PNG conversion should be done on client side",
    });
  } catch (error) {
    console.error("Mermaid export error:", error);
    return NextResponse.json({ error: "Failed to export Mermaid diagram" }, { status: 500 });
  }
}
