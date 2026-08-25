"use client";

import { useRef, useState } from "react";
import type { Interviewe, IntervieweChamp, Statut } from "@/types/database";
import { StatutSelect } from "./StatutSelect";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { LinkOpener, isUrl } from "@/components/LinkOpener";
import type { ColumnDef } from "./ContactsTable";

const rowColor: Record<string, string> = {
  vert: "bg-green-50 hover:bg-green-100",
  orange: "bg-orange-50 hover:bg-orange-100",
  rouge: "bg-red-50 hover:bg-red-100",
};

const inlineInputClass =
  "w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none";

export function IntervieweRow({
  interviewe,
  columns,
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
  columns: ColumnDef[];
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
  const champById = new Map(champs.map((c) => [c.id, c]));

  function handleAutosave() {
    const el = rowRef.current;
    if (!el) return;
    const fd = new FormData();
    el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-autosave-field]").forEach((input) => {
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

  function renderCell(key: string) {
    switch (key) {
      case "prenom":
        return canEditInfo ? (
          <input name="prenom" data-autosave-field defaultValue={interviewe.prenom ?? ""} placeholder="Prénom" className={inlineInputClass} />
        ) : (
          <span className="px-1.5 text-zinc-800">{interviewe.prenom ?? "—"}</span>
        );
      case "nom":
        return canEditInfo ? (
          <input name="nom" data-autosave-field defaultValue={interviewe.nom ?? ""} placeholder="Nom" className={inlineInputClass + " font-medium"} />
        ) : (
          <span className="px-1.5 font-medium text-zinc-900">{interviewe.nom ?? "—"}</span>
        );
      case "email":
        return canEditInfo ? (
          <input name="email" type="email" data-autosave-field defaultValue={interviewe.email ?? ""} placeholder="Email" className={inlineInputClass} />
        ) : (
          <span className="px-1.5 text-zinc-600">{interviewe.email ?? "—"}</span>
        );
      case "telephone":
        return canEditInfo ? (
          <input name="telephone" data-autosave-field defaultValue={interviewe.telephone ?? ""} placeholder="Téléphone" className={inlineInputClass} />
        ) : (
          <span className="px-1.5 text-zinc-600">{interviewe.telephone ?? "—"}</span>
        );
      case "date_rdv":
        return canEditInfo ? (
          <input name="date_rdv" type="date" data-autosave-field defaultValue={interviewe.date_rdv ?? ""} className={inlineInputClass} />
        ) : (
          <span className="px-1.5 text-zinc-600">
            {interviewe.date_rdv ? new Date(interviewe.date_rdv).toLocaleDateString("fr-FR") : "—"}
          </span>
        );
      case "statut":
        return canEditStatut ? (
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
        );
      case "notes":
        return canEditInfo ? (
          <div className="flex items-center gap-1">
            <input name="notes" data-autosave-field defaultValue={interviewe.notes ?? ""} placeholder="Notes" className={inlineInputClass} />
            <LinkOpener value={interviewe.notes} />
          </div>
        ) : (
          <span className="flex items-center gap-1 px-1.5 text-zinc-600">
            {interviewe.notes ?? "—"}
            <LinkOpener value={interviewe.notes} />
          </span>
        );
      default: {
        const champ = champById.get(key);
        if (!champ) return null;
        const value = interviewe.custom_fields?.[champ.id] ?? "";
        if (!canEditInfo) {
          return (
            <span className="flex items-center gap-1 text-zinc-600">
              {value || "—"}
              {isUrl(value) && <LinkOpener value={value} />}
            </span>
          );
        }
        if (champ.type === "liste") {
          return (
            <select
              name={`champ_${champ.id}`}
              data-autosave-field
              defaultValue={value}
              onChange={handleAutosave}
              className={inlineInputClass}
            >
              <option value="">—</option>
              {champ.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          );
        }
        return (
          <div className="flex items-center gap-1">
            <input name={`champ_${champ.id}`} data-autosave-field defaultValue={value} placeholder={champ.label} className={inlineInputClass} />
            <LinkOpener value={value} />
          </div>
        );
      }
    }
  }

  return (
    <tr ref={rowRef} className={bg} onBlur={canEditInfo ? handleAutosave : undefined}>
      {columns.map((c) => (
        <td key={c.key} className="px-2 py-1.5">
          {renderCell(c.key)}
        </td>
      ))}
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
                <ConfirmSubmitButton message="Supprimer définitivement ce contact ?" className="text-xs font-medium text-red-500 hover:underline">
                  Supprimer
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
