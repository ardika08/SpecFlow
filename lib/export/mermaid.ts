/**
 * Mermaid Diagram Export Utilities
 * Convert Mermaid diagrams to PNG/SVG
 */

import mermaid from "mermaid";

/**
 * Initialize Mermaid
 */
export function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
      darkMode: true,
      background: "#1b2635",
      primaryColor: "#3b82f6",
      primaryTextColor: "#f7ecda",
      primaryBorderColor: "#60a5fa",
      lineColor: "#f7ecda",
      secondaryColor: "#64748b",
      tertiaryColor: "#475569",
      fontSize: "16px",
    },
  });
}

/**
 * Extract Mermaid diagrams from markdown
 */
export function extractMermaidDiagrams(markdown: string): string[] {
  const diagrams: string[] = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    diagrams.push(match[1].trim());
  }

  return diagrams;
}

/**
 * Render Mermaid diagram to SVG
 */
export async function renderMermaidToSVG(definition: string): Promise<string> {
  initMermaid();

  try {
    // Generate unique ID for this diagram
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Render the diagram
    const { svg } = await mermaid.render(id, definition);

    return svg;
  } catch (error) {
    console.error("Mermaid render error:", error);
    throw new Error("Failed to render Mermaid diagram");
  }
}

/**
 * Convert SVG to PNG using canvas
 */
export async function svgToPNG(svgString: string, scale: number = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Create an image from SVG
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Set canvas size with scale for better quality
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Scale context
        ctx.scale(scale, scale);

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create PNG blob"));
            }
          },
          "image/png",
          1.0
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG image"));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export Mermaid diagram to PNG
 */
export async function exportMermaidToPNG(
  definition: string,
  filename: string = "diagram.png"
): Promise<void> {
  try {
    const svg = await renderMermaidToSVG(definition);
    const pngBlob = await svgToPNG(svg, 2); // 2x scale for better quality

    // Download the PNG
    const url = URL.createObjectURL(pngBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Mermaid PNG export error:", error);
    throw new Error("Failed to export Mermaid diagram to PNG");
  }
}

/**
 * Export Mermaid diagram to SVG
 */
export async function exportMermaidToSVG(
  definition: string,
  filename: string = "diagram.svg"
): Promise<void> {
  try {
    const svg = await renderMermaidToSVG(definition);

    // Download the SVG
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Mermaid SVG export error:", error);
    throw new Error("Failed to export Mermaid diagram to SVG");
  }
}

/**
 * Export all Mermaid diagrams from markdown
 */
export async function exportAllMermaidDiagrams(
  markdown: string,
  format: "png" | "svg" = "png"
): Promise<void> {
  const diagrams = extractMermaidDiagrams(markdown);

  if (diagrams.length === 0) {
    throw new Error("No Mermaid diagrams found in document");
  }

  for (let i = 0; i < diagrams.length; i++) {
    const filename = `mermaid-diagram-${i + 1}.${format}`;

    if (format === "png") {
      await exportMermaidToPNG(diagrams[i], filename);
    } else {
      await exportMermaidToSVG(diagrams[i], filename);
    }
  }
}
