"use client";

import { useRef, useState } from "react";
import type { Interviewe, IntervieweChamp, Statut } from "@/types/database";
import { IntervieweRow } from "./IntervieweRow";

export interface ColumnDef {
  key: string;
  label: string;
}

const BASE_COLUMNS: ColumnDef[] = [
  { key: "prenom", label: "Prénom" },
  { key: "nom", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "telephone", label: "Téléphone" },
  { key: "date_rdv", label: "Date du RDV" },
  { key: "statut", label: "Statut" },
  { key: "notes", label: "Notes" },
];

const DEFAULT_WIDTH = 160;
const MIN_WIDTH = 90;

export function ContactsTable({
  interviewes,
  champs,
  statuts,
  canEditInfo,
  canEditStatut,
  canDelete,
  updateAction,
  statutAction,
  deleteAction,
}: {
  interviewes: Interviewe[];
  champs: IntervieweChamp[];
  statuts: Statut[];
  canEditInfo: boolean;
  canEditStatut: boolean;
  canDelete: boolean;
  updateAction: (intervieweId: string, formData: FormData) => void | Promise<void>;
  statutAction: (intervieweId: string, statutId: string) => Promise<void>;
  deleteAction: (intervieweId: string) => void;
}) {
  const allColumns: ColumnDef[] = [...BASE_COLUMNS, ...champs.map((c) => ({ key: c.id, label: c.label }))];
  const [order, setOrder] = useState<string[]>(allColumns.map((c) => c.key));
  const [widths, setWidths] = useState<Record<string, number>>({});
  const dragKey = useRef<string | null>(null);
  const resizing = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  // Colonnes ajoutées après le premier rendu (nouvelle colonne perso créée) :
  // on les ajoute à la fin de l'ordre déjà réagencé, sans le perdre.
  const known = new Set(order);
  const fullOrder = [...order, ...allColumns.map((c) => c.key).filter((k) => !known.has(k))];
  const columnByKey = new Map(allColumns.map((c) => [c.key, c]));
  const orderedColumns = fullOrder.map((k) => columnByKey.get(k)).filter((c): c is ColumnDef => !!c);

  function handleDrop(targetKey: string) {
    const from = dragKey.current;
    dragKey.current = null;
    if (!from || from === targetKey) return;
    setOrder(() => {
      const withoutFrom = fullOrder.filter((k) => k !== from);
      const targetIndex = withoutFrom.indexOf(targetKey);
      withoutFrom.splice(targetIndex, 0, from);
      return withoutFrom;
    });
  }

  function onResizeMove(e: MouseEvent) {
    const r = resizing.current;
    if (!r) return;
    const next = Math.max(MIN_WIDTH, r.startWidth + (e.clientX - r.startX));
    setWidths((w) => ({ ...w, [r.key]: next }));
  }
  function onResizeEnd() {
    resizing.current = null;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEnd);
  }
  function startResize(key: string, e: React.MouseEvent) {
    resizing.current = { key, startX: e.clientX, startWidth: widths[key] ?? DEFAULT_WIDTH };
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEnd);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="divide-y divide-zinc-200 text-sm" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {orderedColumns.map((c) => (
            <col key={c.key} style={{ width: widths[c.key] ?? DEFAULT_WIDTH }} />
          ))}
          {(canEditInfo || canDelete) && <col style={{ width: 90 }} />}
        </colgroup>
        <thead className="bg-zinc-50">
          <tr>
            {orderedColumns.map((c) => (
              <th
                key={c.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(c.key)}
                className="relative select-none whitespace-nowrap py-2.5 pl-1 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                <span className="flex items-center gap-1">
                  <span
                    draggable
                    onDragStart={() => {
                      dragKey.current = c.key;
                    }}
                    title="Glisser pour réordonner la colonne"
                    className="cursor-move text-zinc-300 hover:text-zinc-500"
                  >
                    ⠿
                  </span>
                  {c.label}
                </span>
                <span
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startResize(c.key, e);
                  }}
                  title="Glisser pour redimensionner la colonne"
                  className="absolute right-0 top-0 z-20 h-full w-4 cursor-col-resize border-r-4 border-zinc-300 hover:border-sky-dark hover:bg-sky/20"
                />
              </th>
            ))}
            {(canEditInfo || canDelete) && <th />}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {interviewes.map((i) => (
            <IntervieweRow
              key={i.id}
              interviewe={i}
              columns={orderedColumns}
              champs={champs}
              statuts={statuts}
              canEditInfo={canEditInfo}
              canEditStatut={canEditStatut}
              canDelete={canDelete}
              updateAction={(fd) => updateAction(i.id, fd)}
              statutAction={(statutId) => statutAction(i.id, statutId)}
              deleteAction={() => deleteAction(i.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
