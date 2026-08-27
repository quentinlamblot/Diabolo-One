"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { PayeToggleButton } from "@/components/PayeToggleButton";
import type { ProdProjet, ProdProjetPrestataire, ProdStatut, Prestataire } from "@/types/database";
import { ProdPrestataires } from "./[id]/ProdPrestataires";

const STATUT_LABEL: Record<ProdStatut, string> = {
  a_venir: "À venir",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};
const STATUT_COULEUR: Record<ProdStatut, string> = {
  a_venir: "#94a3b8",
  en_cours: "#3b82f6",
  termine: "#22c55e",
  annule: "#ef4444",
};

function formatEuros(n: number | null) {
  if (n === null) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function ProdProjetRow({
  projet,
  restant,
  prestataires,
  assignations,
  toggleClientAction,
  assignAction,
  updateAction,
  removeAction,
}: {
  projet: ProdProjet;
  restant: number;
  prestataires: Prestataire[];
  assignations: ProdProjetPrestataire[];
  toggleClientAction: (paye: boolean) => Promise<void>;
  assignAction: (formData: FormData) => Promise<void>;
  updateAction: (rowId: string, formData: FormData) => Promise<void>;
  removeAction: (rowId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const clientPaye = !!projet.date_paiement_client;

  return (
    <>
      <tr className="hover:bg-zinc-50">
        <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
          <Link href={`/prod/${projet.id}`} className="hover:underline">
            {projet.nom}
          </Link>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{projet.client ?? "—"}</td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{projet.type_prestation ?? "—"}</td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDate(projet.date_prestation)}</td>
        <td className="whitespace-nowrap px-4 py-3">
          <Badge label={STATUT_LABEL[projet.statut]} color={STATUT_COULEUR[projet.statut]} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatEuros(projet.valeur_deal)}</td>
        <td className="whitespace-nowrap px-4 py-3">
          <PayeToggleButton paye={clientPaye} action={toggleClientAction} labelPaye="Payé ✓" labelAPayer="À encaisser" />
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
          {restant > 0 ? <span className="font-medium text-red-600">{formatEuros(restant)}</span> : formatEuros(restant)}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-blue-600 hover:underline">
            {open ? "Masquer" : "Paiements"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={9} className="bg-zinc-50 px-4 py-4">
            <ProdPrestataires assignations={assignations} prestataires={prestataires} assignAction={assignAction} updateAction={updateAction} removeAction={removeAction} />
          </td>
        </tr>
      )}
    </>
  );
}
