import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import type { ProdProjet, ProdStatut } from "@/types/database";

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

export default async function ProdPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: projets }, { data: assignations }] = await Promise.all([
    supabase.from("prod_projets").select("*").order("date_prestation", { ascending: false, nullsFirst: false }),
    supabase.from("prod_projet_prestataires").select("prod_projet_id, montant_du, date_paiement"),
  ]);

  const totauxParProjet = new Map<string, { du: number; restant: number }>();
  for (const a of assignations ?? []) {
    const entry = totauxParProjet.get(a.prod_projet_id) ?? { du: 0, restant: 0 };
    const montant = a.montant_du ?? 0;
    entry.du += montant;
    if (!a.date_paiement) entry.restant += montant;
    totauxParProjet.set(a.prod_projet_id, entry);
  }

  const list = (projets ?? []) as ProdProjet[];
  const valeurTotale = list.reduce((sum, p) => sum + (p.valeur_deal ?? 0), 0);
  const restantDuTotal = Array.from(totauxParProjet.values()).reduce((sum, t) => sum + t.restant, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Diabolo Prod</h1>
          <p className="text-sm text-zinc-500">Suivi perso de tes projets audiovisuels sur mesure</p>
        </div>
        <Link href="/prod/nouveau" className="w-fit rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark">
          + Nouveau projet
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Projets</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{list.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Valeur totale des deals</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{formatEuros(valeurTotale)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Reste à payer aux prestataires</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{formatEuros(restantDuTotal)}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun projet pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <Th>Projet</Th>
                <Th>Client</Th>
                <Th>Type</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Valeur du deal</Th>
                <Th>Reste dû prestataires</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((p) => {
                const totaux = totauxParProjet.get(p.id);
                return (
                  <tr key={p.id} className="cursor-pointer hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                      <Link href={`/prod/${p.id}`} className="hover:underline">
                        {p.nom}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.client ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.type_prestation ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDate(p.date_prestation)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge label={STATUT_LABEL[p.statut]} color={STATUT_COULEUR[p.statut]} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatEuros(p.valeur_deal)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {totaux && totaux.restant > 0 ? (
                        <span className="font-medium text-red-600">{formatEuros(totaux.restant)}</span>
                      ) : (
                        formatEuros(totaux?.restant ?? 0)
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</th>;
}
