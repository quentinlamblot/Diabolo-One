"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import type { Statut, Prestataire } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

export function StatutItem({
  statut,
  intervieweStatuts,
  videoStatuts,
  prestataires,
  updateAction,
  deleteAction,
}: {
  statut: Statut;
  intervieweStatuts?: Statut[];
  videoStatuts?: Statut[];
  prestataires?: Prestataire[];
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
        {statut.statut_video_lie && <span className="text-xs text-zinc-400">→ vidéo : {statut.statut_video_lie.label}</span>}
        {statut.responsable_defaut && <span className="text-xs text-zinc-400">👤 {statut.responsable_defaut.nom}</span>}
        {statut.est_etape_montage && <span className="text-xs text-zinc-400" title="Étape de montage">✂️ Montage</span>}
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
      {videoStatuts && (
        <select
          name="statut_video_lie_id"
          defaultValue={statut.statut_video_lie_id ?? ""}
          className="input w-44"
          title="Statut de la vidéo déclenché par ce statut contact"
        >
          <option value="">— Aucune vidéo déclenchée —</option>
          {videoStatuts.map((s) => (
            <option key={s.id} value={s.id}>
              → vidéo : {s.label}
            </option>
          ))}
        </select>
      )}
      {prestataires && (
        <select
          name="responsable_defaut_id"
          defaultValue={statut.responsable_defaut_id ?? ""}
          className="input w-44"
          title="Responsable par défaut de cette colonne, pour tout projet qui n'a pas son propre choix"
        >
          <option value="">— Aucun responsable par défaut —</option>
          {prestataires.map((p) => (
            <option key={p.id} value={p.id}>
              👤 {p.nom}
            </option>
          ))}
        </select>
      )}
      {statut.type === "video" && (
        <label className="flex items-center gap-1 text-xs text-zinc-600" title="Le responsable de cette colonne reçoit automatiquement le paiement monteur à la livraison">
          <input type="checkbox" name="est_etape_montage" defaultChecked={statut.est_etape_montage} className="h-3.5 w-3.5" />
          ✂️ Montage
        </label>
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
