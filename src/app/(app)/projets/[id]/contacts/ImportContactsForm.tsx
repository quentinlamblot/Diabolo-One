"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { IntervieweChamp } from "@/types/database";

type Target =
  | "ignore"
  | "prenom"
  | "nom"
  | "email"
  | "telephone"
  | "date_rdv"
  | "statut"
  | "new"
  | `existing:${string}`;

interface ColumnMapping {
  header: string;
  target: Target;
  customLabel: string;
}

const KNOWN_TARGETS: { value: Target; label: string }[] = [
  { value: "ignore", label: "Ignorer cette colonne" },
  { value: "prenom", label: "Prénom" },
  { value: "nom", label: "Nom" },
  { value: "email", label: "Email" },
  { value: "telephone", label: "Téléphone" },
  { value: "date_rdv", label: "Date du RDV" },
  { value: "statut", label: "Statut" },
];

function guessTarget(header: string, champs: IntervieweChamp[]): Target {
  const h = header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  if (h === "prenom") return "prenom";
  if (h === "nom") return "nom";
  if (h === "email") return "email";
  if (h === "telephone" || h === "tel") return "telephone";
  if (h.includes("rdv") || h.includes("rendez")) return "date_rdv";
  if (h === "statut") return "statut";
  const existing = champs.find((c) => c.label.trim().toLowerCase() === h);
  if (existing) return `existing:${existing.id}`;
  return "new";
}

export function ImportContactsForm({
  champs,
  action,
}: {
  champs: IntervieweChamp[];
  action: (formData: FormData) => Promise<{ imported: number; skipped: number }>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setResult(null);
    setError(null);
    setMapping([]);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        setError("Ce fichier ne contient aucune feuille lisible.");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

      // La ligne d'en-têtes n'est pas toujours la première (ligne de titre, ligne vide...) :
      // on prend la première ligne du fichier qui contient au moins une cellule non vide.
      const headerRowIndex = rows.findIndex(
        (row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim().length > 0)
      );

      if (headerRowIndex === -1) {
        setError("Aucune colonne détectée dans ce fichier. Vérifiez qu'il contient bien des données.");
        return;
      }

      const headerRow = rows[headerRowIndex]
        .map((h) => String(h ?? "").trim())
        .filter((h) => h.length > 0);

      setHeaderRowIndex(headerRowIndex);
      setMapping(headerRow.map((h) => ({ header: h, target: guessTarget(h, champs), customLabel: h })));
    } catch (err) {
      setError(
        err instanceof Error
          ? `Impossible de lire ce fichier : ${err.message}`
          : "Impossible de lire ce fichier."
      );
    }
  }

  async function handleSubmit() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("mapping", JSON.stringify(mapping));
      fd.set("headerRowIndex", String(headerRowIndex));
      const res = await action(fd);
      setResult(res);
      setFile(null);
      setMapping([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-900">Importer des contacts depuis un fichier Excel</p>
      <p className="text-xs text-zinc-500">
        Choisissez un fichier avec les colonnes de votre choix, puis indiquez à quoi correspond chaque colonne.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {mapping.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-medium text-zinc-700">Correspondance des colonnes</p>
          {mapping.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-40 truncate text-sm text-zinc-800" title={m.header}>
                {m.header}
              </span>
              <span className="text-zinc-400">→</span>
              <select
                value={m.target}
                onChange={(e) => {
                  const target = e.target.value as Target;
                  setMapping((prev) => prev.map((row, idx) => (idx === i ? { ...row, target } : row)));
                }}
                className="input"
              >
                {KNOWN_TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                {champs.map((c) => (
                  <option key={c.id} value={`existing:${c.id}`}>
                    Colonne perso : {c.label}
                  </option>
                ))}
                <option value="new">+ Nouvelle colonne personnalisée</option>
              </select>
              {m.target === "new" && (
                <input
                  value={m.customLabel}
                  onChange={(e) => {
                    const customLabel = e.target.value;
                    setMapping((prev) => prev.map((row, idx) => (idx === i ? { ...row, customLabel } : row)));
                  }}
                  placeholder="Nom de la colonne"
                  className="input w-40"
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="w-fit rounded-full bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-sky-dark disabled:opacity-50"
          >
            {pending ? "Import..." : "Importer"}
          </button>
        </div>
      )}

      {result && (
        <p className="text-sm text-green-600">
          {result.imported} contact{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
          {result.skipped > 0 ? `, ${result.skipped} ligne(s) ignorée(s)` : ""}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
