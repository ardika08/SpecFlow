/**
 * PDF Export Utilities
 * Client-side PDF generation using jsPDF
 */

/**
 * Generate PDF from markdown content
 * This runs on the client side in the browser
 */
export async function generatePDF(
  markdown: string,
  title: string = "PRD"
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");

  // Create PDF document (A4 size, portrait)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  let yPosition = margin;

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, yPosition);
  yPosition += lineHeight * 2;

  // Add separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight * 1.5;

  // Reset font for content
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  // Parse markdown and add to PDF
  const lines = markdown.split("\n");

  for (const line of lines) {
    // Check if we need a new page
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      const headerText = line.replace(/^#+\s*/, "");
      const level = (line.match(/^#+/) || [""])[0].length;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18 - level * 2); // H1=18, H2=16, H3=14, etc.

      doc.text(headerText, margin, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }
    // Handle horizontal rules
    else if (line.startsWith("---")) {
      yPosition += lineHeight;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 1.5;
    }
    // Handle code blocks
    else if (line.startsWith("```")) {
      yPosition += lineHeight;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, maxWidth, lineHeight * 3, "F");
      yPosition += lineHeight;
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text("[Code Block]", margin + 2, yPosition);
      yPosition += lineHeight * 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }
    // Handle list items
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listItem = line.replace(/^[-*]\s*/, "");
      const textLines = doc.splitTextToSize(listItem, maxWidth - 5);

      for (const textLine of textLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text("• " + textLine, margin + 5, yPosition);
        yPosition += lineHeight;
      }
    }
    // Handle bullet points with numbering
    else if (line.match(/^\d+\.\s/)) {
      const textLines = doc.splitTextToSize(line, maxWidth);

      for (const textLine of textLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += lineHeight;
      }
    }
    // Handle empty lines
    else if (line.trim() === "") {
      yPosition += lineHeight;
    }
    // Regular text
    else {
      const textLines = doc.splitTextToSize(line, maxWidth);

      for (const textLine of textLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(textLine, margin, yPosition);
        yPosition += lineHeight;
      }
    }
  }

  // Generate PDF as blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string = "prd.pdf") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate and download PDF from markdown
 */
export async function exportToPDF(
  markdown: string,
  title: string = "PRD",
  filename?: string
): Promise<void> {
  try {
    const pdfBlob = await generatePDF(markdown, title);
    downloadPDF(pdfBlob, filename || `${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to generate PDF");
  }
}
