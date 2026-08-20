"use client";

import { jsPDF } from "jspdf";
import type { Section } from "../../onboarding/questions";

export function BriefPdfButton({
  projetNom,
  sections,
  reponses,
}: {
  projetNom: string;
  sections: Section[];
  reponses: Record<string, string>;
}) {
  function handleDownload() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginX * 2;
    let y = 56;

    function ensureSpace(needed: number) {
      if (y + needed > pageHeight - 48) {
        doc.addPage();
        y = 56;
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    ensureSpace(24);
    doc.text(`Brief client — ${projetNom}`, marginX, y);
    y += 28;

    for (const section of sections) {
      ensureSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(section.title, marginX, y);
      y += 18;

      for (const q of section.questions) {
        const valeur = reponses[q.key] || "—";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const labelLines: string[] = doc.splitTextToSize(q.label, maxWidth);
        ensureSpace(labelLines.length * 13 + 4);
        doc.text(labelLines, marginX, y);
        y += labelLines.length * 13 + 2;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const valeurLines: string[] = doc.splitTextToSize(valeur, maxWidth);
        ensureSpace(valeurLines.length * 13 + 10);
        doc.text(valeurLines, marginX, y);
        y += valeurLines.length * 13 + 10;
      }
      y += 6;
    }

    doc.save(`brief-${projetNom.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        // Le bouton est dans un <summary> : sans ça, le clic replierait
        // aussi le <details> parent.
        e.preventDefault();
        handleDownload();
      }}
      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
    >
      Télécharger en PDF
    </button>
  );
}
