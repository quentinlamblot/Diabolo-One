"use client";

import { useRef, useState } from "react";

export function ImportContactsForm({ action }: { action: (formData: FormData) => Promise<{ imported: number; skipped: number }> }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={ref}
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        setResult(null);
        try {
          const formData = new FormData(ref.current!);
          const res = await action(formData);
          setResult(res);
          ref.current?.reset();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm font-medium text-zinc-900">Importer des contacts depuis un fichier Excel</p>
      <p className="text-xs text-zinc-500">
        Colonnes attendues (première ligne = en-têtes) : Prénom, Nom, Email, Téléphone, Statut (optionnel).
      </p>
      <div className="flex items-center gap-2">
        <input name="file" type="file" accept=".xlsx,.xls,.csv" required className="input" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Import..." : "Importer"}
        </button>
      </div>
      {result && (
        <p className="text-sm text-green-600">
          {result.imported} contact{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
          {result.skipped > 0 ? `, ${result.skipped} ligne(s) ignorée(s)` : ""}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
