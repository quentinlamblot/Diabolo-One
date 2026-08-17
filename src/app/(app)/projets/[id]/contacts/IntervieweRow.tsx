"use client";

import { useState } from "react";
import type { Interviewe, IntervieweChamp, Statut } from "@/types/database";
import { StatutSelect } from "./StatutSelect";

const rowColor: Record<string, string> = {
  vert: "bg-green-50 hover:bg-green-100",
  orange: "bg-orange-50 hover:bg-orange-100",
  rouge: "bg-red-50 hover:bg-red-100",
};

export function IntervieweRow({
  interviewe,
  champs,
  statuts,
  canEditInfo,
  canEditStatut,
  canDelete,
  updateAction,
  statutAction,
  deleteAction,
}: {
  interviewe: Interviewe;
  champs: IntervieweChamp[];
  statuts: Statut[];
  canEditInfo: boolean;
  canEditStatut: boolean;
  canDelete: boolean;
  updateAction: (formData: FormData) => void;
  statutAction: (statutId: string) => Promise<void>;
  deleteAction: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const bg = rowColor[interviewe.statuts?.categorie ?? ""] ?? "hover:bg-zinc-50";

  if (editing) {
    return (
      <tr className="bg-zinc-50">
        <td colSpan={7 + champs.length} className="p-3">
          <form
            action={(fd) => {
              updateAction(fd);
              setEditing(false);
            }}
            className="grid grid-cols-4 gap-2"
          >
            <input name="prenom" defaultValue={interviewe.prenom ?? ""} placeholder="Prénom" className="input" />
            <input name="nom" defaultValue={interviewe.nom} placeholder="Nom" required className="input" />
            <input name="email" type="email" defaultValue={interviewe.email ?? ""} placeholder="Email" className="input" />
            <input name="telephone" defaultValue={interviewe.telephone ?? ""} placeholder="Téléphone" className="input" />
            <input name="date_rdv" type="date" defaultValue={interviewe.date_rdv ?? ""} className="input" />
            <input name="notes" defaultValue={interviewe.notes ?? ""} placeholder="Notes" className="input col-span-2" />
            {champs.map((c) => (
              <input
                key={c.id}
                name={`champ_${c.id}`}
                defaultValue={interviewe.custom_fields?.[c.id] ?? ""}
                placeholder={c.label}
                className="input"
              />
            ))}
            <div className="col-span-4 flex gap-2">
              <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs font-medium text-zinc-500 hover:underline"
              >
                Annuler
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={bg}>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-800">{interviewe.prenom ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{interviewe.nom}</td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{interviewe.email ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{interviewe.telephone ?? "—"}</td>
      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
        {interviewe.date_rdv ? new Date(interviewe.date_rdv).toLocaleDateString("fr-FR") : "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {canEditStatut ? (
          <StatutSelect statuts={statuts} value={interviewe.statut_id} onChange={statutAction} />
        ) : interviewe.statuts ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${interviewe.statuts.couleur}22`, color: interviewe.statuts.couleur }}
          >
            {interviewe.statuts.label}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-zinc-600">{interviewe.notes ?? "—"}</td>
      {champs.map((c) => (
        <td key={c.id} className="whitespace-nowrap px-4 py-3 text-zinc-600">
          {interviewe.custom_fields?.[c.id] || "—"}
        </td>
      ))}
      {(canEditInfo || canDelete) && (
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex justify-end gap-3">
            {canEditInfo && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Modifier
              </button>
            )}
            {canDelete && (
              <form action={deleteAction}>
                <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
                  Supprimer
                </button>
              </form>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
