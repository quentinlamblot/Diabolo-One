"use client";

import * as XLSX from "xlsx";
import type { IntervieweChamp } from "@/types/database";

export function DownloadTemplateButton({ champs }: { champs: IntervieweChamp[] }) {
  function handleDownload() {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "Date du RDV", "Statut", "Notes", ...champs.map((c) => c.label)];
    const exemple = [
      "Jeanne",
      "Dupont",
      "jeanne.dupont@exemple.fr",
      "0612345678",
      "2026-09-15",
      "À contacter",
      "",
      ...champs.map(() => ""),
    ];
    const sheet = XLSX.utils.aoa_to_sheet([headers, exemple]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Contacts");
    XLSX.writeFile(workbook, "modele-contacts.xlsx");
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
    >
      Télécharger le modèle Excel
    </button>
  );
}
