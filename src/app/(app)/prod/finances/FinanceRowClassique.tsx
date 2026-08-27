"use client";

import { useState } from "react";
import Link from "next/link";
import { PayeToggleButton } from "@/components/PayeToggleButton";
import type { TachePrestataire } from "@/types/database";

function formatEuros(n: number) {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export function FinanceRowClassique({
  ligne,
  taches,
  toggleClientAction,
  toggleTacheAction,
}: {
  ligne: { id: string; nom: string; href: string; client: string | null; facture: number; encaisse: boolean; du: number; restantDu: number };
  taches: TachePrestataire[];
  toggleClientAction: (paye: boolean) => Promise<void>;
  toggleTacheAction: (tacheId: string, paye: boolean) => Promise<void>;
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
          {taches.length > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-blue-600 hover:underline">
              {open ? "Masquer" : "Paiements"}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-zinc-50 px-4 py-4">
            <div className="flex flex-col divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
              {taches.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-zinc-900">
                    {t.prestataires?.nom ?? "—"} <span className="text-zinc-400">— {t.description}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-zinc-900">{formatEuros(Number(t.montant))}</span>
                    <PayeToggleButton paye={t.paye} action={(paye) => toggleTacheAction(t.id, paye)} />
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
