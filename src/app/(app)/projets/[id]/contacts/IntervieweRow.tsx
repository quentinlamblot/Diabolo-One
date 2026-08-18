"use client";

import { useRef, useState } from "react";
import type { Interviewe, IntervieweChamp, Statut } from "@/types/database";
import { StatutSelect } from "./StatutSelect";

const rowColor: Record<string, string> = {
  vert: "bg-green-50 hover:bg-green-100",
  orange: "bg-orange-50 hover:bg-orange-100",
  rouge: "bg-red-50 hover:bg-red-100",
};

const inlineInputClass =
  "w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none";

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
  updateAction: (formData: FormData) => void | Promise<void>;
  statutAction: (statutId: string) => Promise<void>;
  deleteAction: () => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bg = rowColor[interviewe.statuts?.categorie ?? ""] ?? "hover:bg-zinc-50";

  function handleAutosave() {
    const el = rowRef.current;
    if (!el) return;
    const fd = new FormData();
    el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-autosave-field]").forEach((input) => {
      fd.set(input.name, input.value);
    });
    setSaving(true);
    setSaved(false);
    Promise.resolve(updateAction(fd)).finally(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <tr ref={rowRef} className={bg} onBlur={canEditInfo ? handleAutosave : undefined}>
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="prenom"
            data-autosave-field
            defaultValue={interviewe.prenom ?? ""}
            placeholder="Prénom"
            className={inlineInputClass}
          />
        ) : (
          <span className="px-1.5 text-zinc-800">{interviewe.prenom ?? "—"}</span>
        )}
      </td>
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="nom"
            data-autosave-field
            defaultValue={interviewe.nom ?? ""}
            placeholder="Nom"
            className={inlineInputClass + " font-medium"}
          />
        ) : (
          <span className="px-1.5 font-medium text-zinc-900">{interviewe.nom ?? "—"}</span>
        )}
      </td>
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="email"
            type="email"
            data-autosave-field
            defaultValue={interviewe.email ?? ""}
            placeholder="Email"
            className={inlineInputClass}
          />
        ) : (
          <span className="px-1.5 text-zinc-600">{interviewe.email ?? "—"}</span>
        )}
      </td>
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="telephone"
            data-autosave-field
            defaultValue={interviewe.telephone ?? ""}
            placeholder="Téléphone"
            className={inlineInputClass}
          />
        ) : (
          <span className="px-1.5 text-zinc-600">{interviewe.telephone ?? "—"}</span>
        )}
      </td>
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="date_rdv"
            type="date"
            data-autosave-field
            defaultValue={interviewe.date_rdv ?? ""}
            className={inlineInputClass}
          />
        ) : (
          <span className="px-1.5 text-zinc-600">
            {interviewe.date_rdv ? new Date(interviewe.date_rdv).toLocaleDateString("fr-FR") : "—"}
          </span>
        )}
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
      <td className="px-2 py-1.5">
        {canEditInfo ? (
          <input
            name="notes"
            data-autosave-field
            defaultValue={interviewe.notes ?? ""}
            placeholder="Notes"
            className={inlineInputClass}
          />
        ) : (
          <span className="px-1.5 text-zinc-600">{interviewe.notes ?? "—"}</span>
        )}
      </td>
      {champs.map((c) =>
        canEditInfo ? (
          <td key={c.id} className="px-2 py-1.5">
            <input
              name={`champ_${c.id}`}
              data-autosave-field
              defaultValue={interviewe.custom_fields?.[c.id] ?? ""}
              placeholder={c.label}
              className={inlineInputClass}
            />
          </td>
        ) : (
          <td key={c.id} className="whitespace-nowrap px-4 py-3 text-zinc-600">
            {interviewe.custom_fields?.[c.id] || "—"}
          </td>
        )
      )}
      {(canEditInfo || canDelete) && (
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex items-center justify-end gap-3">
            {canEditInfo && (
              <span className="text-xs text-zinc-400">
                {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : ""}
              </span>
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
