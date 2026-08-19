"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import type { Statut } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

export function StatutItem({
  statut,
  intervieweStatuts,
  updateAction,
  deleteAction,
}: {
  statut: Statut;
  intervieweStatuts?: Statut[];
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const categorieIcon: Record<string, string> = { vert: "🟢", orange: "🟠", rouge: "🔴" };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <Badge label={statut.label} color={statut.couleur} />
        {statut.categorie && <span title={statut.categorie}>{categorieIcon[statut.categorie]}</span>}
        {statut.statut_interviewe_lie && (
          <span className="text-xs text-zinc-400">→ contact : {statut.statut_interviewe_lie.label}</span>
        )}
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
    <AutosaveForm
      action={updateAction}
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
      {intervieweStatuts && (
        <select
          name="statut_interviewe_lie_id"
          defaultValue={statut.statut_interviewe_lie_id ?? ""}
          className="input w-44"
          title="Statut du contact déclenché par cette étape"
        >
          <option value="">— Aucun changement contact —</option>
          {intervieweStatuts.map((s) => (
            <option key={s.id} value={s.id}>
              → contact : {s.label}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs font-medium text-zinc-500 hover:underline"
      >
        Fermer
      </button>
    </AutosaveForm>
  );
}
