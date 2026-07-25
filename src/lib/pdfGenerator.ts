import { jsPDF } from "jspdf";
import { ResearchPaper } from "@/components/PaperReaderDialog";

export function generatePaperPDF(paper: ResearchPaper): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  doc.setFillColor(22, 78, 67); // Foretyx Teal Deep (#164e43)
  doc.rect(0, 0, pageWidth, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("FORETYX SECURITY RESEARCH · PUBLIC ADVISORY", margin, 8);

  y = 22;

  // Tag Badge
  doc.setFillColor(235, 243, 240);
  doc.setDrawColor(22, 78, 67);
  doc.roundedRect(margin, y, 36, 6, 1, 1, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(22, 78, 67);
  doc.text(paper.tag.toUpperCase(), margin + 3, y + 4.2);

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(paper.date, pageWidth - margin - doc.getTextWidth(paper.date), y + 4.5);

  y += 12;

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(28, 25, 23);
  const titleLines = doc.splitTextToSize(paper.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 2;

  // Authors & Citation
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Authors: ${paper.authors.join(", ")}  |  ${paper.citation}`, margin, y);
  y += 6;

  // Line Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Executive Abstract Callout Box
  doc.setFillColor(245, 247, 246);
  doc.setDrawColor(22, 78, 67);
  const abstractText = `Executive Abstract: "${paper.abstract}"`;
  const abstractLines = doc.splitTextToSize(abstractText, contentWidth - 8);
  const boxHeight = abstractLines.length * 5 + 8;

  doc.rect(margin, y, contentWidth, boxHeight, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(22, 78, 67);
  doc.text(abstractLines, margin + 4, y + 6);
  y += boxHeight + 10;

  // Sections
  paper.sections.forEach((sec) => {
    if (y + 35 > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(28, 25, 23);
    doc.text(sec.heading, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(45, 45, 45);
    const contentLines = doc.splitTextToSize(sec.content, contentWidth);

    contentLines.forEach((line: string) => {
      if (y > pageHeight - margin - 15) {
        doc.addPage();
        y = margin + 10;
      }
      doc.text(line, margin, y);
      y += 5;
    });

    if (sec.codeSnippet) {
      y += 2;
      const codeLines = doc.splitTextToSize(sec.codeSnippet, contentWidth - 8);
      const codeBoxHeight = codeLines.length * 4.5 + 6;

      if (y + codeBoxHeight > pageHeight - margin) {
        doc.addPage();
        y = margin + 10;
      }

      doc.setFillColor(20, 22, 20);
      doc.rect(margin, y, contentWidth, codeBoxHeight, "F");

      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(52, 211, 153);
      doc.text(codeLines, margin + 4, y + 5);

      y += codeBoxHeight + 6;
    }

    y += 4;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text("Foretyx Security Research · Attested Enclave Signature", margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 7);
  }

  const fileName = `${paper.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(fileName);
  return fileName;
}
