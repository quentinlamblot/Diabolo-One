"use client";

import { useState } from "react";
import type { Prestataire, ProdProjetPrestataire } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

function formatEuros(n: number | null) {
  if (n === null) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function ProdPrestataires({
  assignations,
  prestataires,
  assignAction,
  updateAction,
  removeAction,
}: {
  assignations: ProdProjetPrestataire[];
  prestataires: Prestataire[];
  assignAction: (formData: FormData) => Promise<void>;
  updateAction: (rowId: string, formData: FormData) => Promise<void>;
  removeAction: (rowId: string) => Promise<void>;
}) {
  const assignedIds = new Set(assignations.map((a) => a.prestataire_id));
  const disponibles = prestataires.filter((p) => !assignedIds.has(p.id));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Prestataires & paiements</h2>

      {assignations.length === 0 ? (
        <p className="mb-4 text-sm text-zinc-500">Aucun prestataire affecté.</p>
      ) : (
        <div className="mb-4 flex flex-col divide-y divide-zinc-100">
          {assignations.map((a) => (
            <PrestataireRow key={a.id} assignation={a} updateAction={updateAction} removeAction={removeAction} />
          ))}
        </div>
      )}

      {disponibles.length > 0 && (
        <form action={assignAction} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
            Prestataire
            <select name="prestataire_id" defaultValue="" required className="input">
              <option value="" disabled>
                Choisir...
              </option>
              {disponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
            Montant dû (€)
            <input type="number" step="0.01" min={0} name="montant_du" className="input w-32" />
          </label>
          <button type="submit" className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark">
            Affecter
          </button>
        </form>
      )}
    </div>
  );
}

function PrestataireRow({
  assignation,
  updateAction,
  removeAction,
}: {
  assignation: ProdProjetPrestataire;
  updateAction: (rowId: string, formData: FormData) => Promise<void>;
  removeAction: (rowId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const paye = !!assignation.date_paiement;

  if (!editing) {
    return (
      <div className="flex items-center justify-between py-2.5 text-sm">
        <span className="font-medium text-zinc-900">{assignation.prestataires?.nom}</span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-600">{formatEuros(assignation.montant_du)}</span>
          <span className={paye ? "text-xs font-medium text-emerald-600" : "text-xs font-medium text-amber-600"}>
            {paye ? `Payé le ${formatDateCourte(assignation.date_paiement!)}` : "Non payé"}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-blue-600 hover:underline">
            Modifier
          </button>
          <form action={() => removeAction(assignation.id)}>
            <button type="submit" className="text-zinc-400 hover:text-red-600" aria-label="Retirer">
              ×
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2.5">
      <AutosaveForm action={(fd) => updateAction(assignation.id, fd)} className="flex flex-wrap items-end gap-2">
        <span className="text-sm font-medium text-zinc-900">{assignation.prestataires?.nom}</span>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Montant dû (€)
          <input type="number" step="0.01" min={0} name="montant_du" defaultValue={assignation.montant_du ?? ""} className="input w-32" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Payé le
          <input type="date" name="date_paiement" defaultValue={assignation.date_paiement ?? ""} className="input" />
        </label>
      </AutosaveForm>
      <button type="button" onClick={() => setEditing(false)} className="w-fit text-xs text-zinc-500 hover:underline">
        Fermer
      </button>
    </div>
  );
}

function formatDateCourte(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}
