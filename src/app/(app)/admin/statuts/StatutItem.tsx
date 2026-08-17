"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import type { Statut } from "@/types/database";

export function StatutItem({
  statut,
  updateAction,
  deleteAction,
}: {
  statut: Statut;
  updateAction: (formData: FormData) => void;
  deleteAction: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const categorieIcon: Record<string, string> = { vert: "🟢", orange: "🟠", rouge: "🔴" };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge label={statut.label} color={statut.couleur} />
        {statut.categorie && <span title={statut.categorie}>{categorieIcon[statut.categorie]}</span>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Modifier
        </button>
        <form action={deleteAction}>
          <button type="submit" className="text-zinc-400 hover:text-red-600" aria-label="Supprimer">
            ×
          </button>
        </form>
      </span>
    );
  }

  return (
    <form
      action={(fd) => {
        updateAction(fd);
        setEditing(false);
      }}
      className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2"
    >
      <input name="label" defaultValue={statut.label} required className="input w-32" />
      <input name="couleur" type="color" defaultValue={statut.couleur} className="input h-9 w-14 p-1" />
      <select name="categorie" defaultValue={statut.categorie ?? ""} className="input w-32">
        <option value="">Pas de catégorie</option>
        <option value="vert">🟢 Vert</option>
        <option value="orange">🟠 Orange</option>
        <option value="rouge">🔴 Rouge</option>
      </select>
      <input name="ordre" type="number" defaultValue={statut.ordre} className="input w-16" />
      <button type="submit" className="rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
        Enregistrer
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs font-medium text-zinc-500 hover:underline"
      >
        Annuler
      </button>
    </form>
  );
}
