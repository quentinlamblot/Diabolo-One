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
const WIDE_WIDTH = 320;

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

  // Pointer Events + capture explicite plutôt que mousedown/mousemove sur le
  // document : la capture garantit que CET élément reçoit tous les
  // pointermove/pointerup jusqu'au relâchement, même si le curseur sort
  // brièvement de la zone ou si le tableau se re-rend pendant le glisser
  // (ce qui arrive à chaque pixel, puisque la largeur change en direct).
  // C'est le mécanisme standard pour une poignée de redimensionnement
  // fiable sur souris, trackpad et tactile.
  function startResize(key: string, e: React.PointerEvent<HTMLSpanElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    const startX = e.clientX;
    const startWidth = widths[key] ?? DEFAULT_WIDTH;
    handle.setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const next = Math.max(MIN_WIDTH, startWidth + (ev.clientX - startX));
      setWidths((w) => ({ ...w, [key]: next }));
    }
    function onUp(ev: PointerEvent) {
      handle.releasePointerCapture(ev.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    }
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  // Alternative au glisser, en un clic : bascule la colonne entre une largeur
  // large (pour lire une valeur tronquée, ex. un numéro de téléphone complet)
  // et sa largeur d'origine.
  function toggleWide(key: string) {
    setWidths((w) => ({ ...w, [key]: (w[key] ?? DEFAULT_WIDTH) >= WIDE_WIDTH ? DEFAULT_WIDTH : WIDE_WIDTH }));
  }

  // Un <table> en width:auto s'étire par défaut sur toute la largeur
  // disponible du parent (comportement normal d'une boîte de bloc), ce qui
  // force le navigateur à rétrécir les colonnes pour tenir dans cet espace
  // même en table-layout:fixed — les largeurs choisies ne s'affichaient donc
  // jamais réellement. En fixant une largeur totale explicite égale à la
  // somme des colonnes, le tableau garde sa taille naturelle et déborde
  // dans le conteneur défilant, comme prévu.
  const actionColWidth = canEditInfo || canDelete ? 90 : 0;
  const totalWidth = orderedColumns.reduce((sum, c) => sum + (widths[c.key] ?? DEFAULT_WIDTH), actionColWidth);

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="divide-y divide-zinc-200 text-sm" style={{ tableLayout: "fixed", width: totalWidth }}>
        <thead className="bg-zinc-50">
          <tr>
            {orderedColumns.map((c) => (
              <th
                key={c.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(c.key)}
                style={{ width: widths[c.key] ?? DEFAULT_WIDTH }}
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
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    startResize(c.key, e);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleWide(c.key);
                  }}
                  title="Glisser pour redimensionner, ou double-cliquer pour agrandir/réduire"
                  style={{ touchAction: "none" }}
                  className="absolute right-0 top-0 z-20 h-full w-4 cursor-col-resize border-r-4 border-zinc-300 hover:border-sky-dark hover:bg-sky/20"
                />
              </th>
            ))}
            {(canEditInfo || canDelete) && <th style={{ width: 90 }} />}
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
