"use client";

import { useState } from "react";
import Link from "next/link";
import { PayeToggleButton } from "@/components/PayeToggleButton";
import { ProdPrestataires } from "../[id]/ProdPrestataires";
import type { Prestataire, ProdProjetPrestataire } from "@/types/database";

function formatEuros(n: number) {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function FinanceRowProd({
  ligne,
  prestataires,
  assignations,
  toggleClientAction,
  assignAction,
  updateAction,
  removeAction,
}: {
  ligne: { id: string; nom: string; href: string; client: string | null; facture: number; encaisse: boolean; du: number; restantDu: number };
  prestataires: Prestataire[];
  assignations: ProdProjetPrestataire[];
  toggleClientAction: (paye: boolean) => Promise<void>;
  assignAction: (formData: FormData) => Promise<void>;
  updateAction: (rowId: string, formData: FormData) => Promise<void>;
  removeAction: (rowId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const marge = ligne.facture - ligne.du;

  return (
    <>
      <tr className="hover:bg-zinc-50">
        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900">
          <Link href={ligne.href} className="hover:underline">
            {ligne.nom}
          </Link>
        </td>
        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{ligne.client ?? "—"}</td>
        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{formatEuros(ligne.facture)}</td>
        <td className="whitespace-nowrap px-4 py-2.5">
          <PayeToggleButton paye={ligne.encaisse} action={toggleClientAction} labelPaye="Payé ✓" labelAPayer="À encaisser" />
        </td>
        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{formatEuros(ligne.du)}</td>
        <td className="whitespace-nowrap px-4 py-2.5">
          {ligne.restantDu > 0 ? <span className="font-medium text-orange-600">{formatEuros(ligne.restantDu)}</span> : formatEuros(0)}
        </td>
        <td className={`whitespace-nowrap px-4 py-2.5 font-medium ${marge >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {formatEuros(marge)}
        </td>
        <td className="whitespace-nowrap px-4 py-2.5">
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-blue-600 hover:underline">
            {open ? "Masquer" : "Paiements"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-zinc-50 px-4 py-4">
            <ProdPrestataires assignations={assignations} prestataires={prestataires} assignAction={assignAction} updateAction={updateAction} removeAction={removeAction} />
          </td>
        </tr>
      )}
    </>
  );
}
