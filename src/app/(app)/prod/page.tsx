import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import type { ProdProjet, ProdProjetPrestataire, Prestataire } from "@/types/database";
import { ProdProjetRow } from "./ProdProjetRow";
import { toggleProdClientPaye, assignPrestataireProd, updatePrestataireProd, removePrestataireProd } from "./actions";

function formatEuros(n: number | null) {
  if (n === null) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

export default async function ProdPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: projets }, { data: assignations }, { data: prestataires }] = await Promise.all([
    supabase.from("prod_projets").select("*").order("date_prestation", { ascending: false, nullsFirst: false }),
    supabase.from("prod_projet_prestataires").select("*, prestataires(*)"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);

  const totauxParProjet = new Map<string, { du: number; restant: number }>();
  const assignationsParProjet = new Map<string, ProdProjetPrestataire[]>();
  for (const a of (assignations ?? []) as ProdProjetPrestataire[]) {
    const entry = totauxParProjet.get(a.prod_projet_id) ?? { du: 0, restant: 0 };
    const montant = a.montant_du ?? 0;
    entry.du += montant;
    if (!a.date_paiement) entry.restant += montant;
    totauxParProjet.set(a.prod_projet_id, entry);

    const liste = assignationsParProjet.get(a.prod_projet_id) ?? [];
    liste.push(a);
    assignationsParProjet.set(a.prod_projet_id, liste);
  }

  const list = (projets ?? []) as ProdProjet[];
  const prestataireList = (prestataires ?? []) as Prestataire[];
  const valeurTotale = list.reduce((sum, p) => sum + (p.valeur_deal ?? 0), 0);
  const restantDuTotal = Array.from(totauxParProjet.values()).reduce((sum, t) => sum + t.restant, 0);
  const restantAEncaisserTotal = list.reduce((sum, p) => sum + (p.date_paiement_client ? 0 : (p.valeur_deal ?? 0)), 0);

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Projets</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{list.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Valeur totale des deals</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{formatEuros(valeurTotale)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Reste à encaisser</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{formatEuros(restantAEncaisserTotal)}</p>
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
                <Th>Statut client</Th>
                <Th>Reste dû prestataires</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((p) => {
                const boundToggleClient = async (paye: boolean) => {
                  "use server";
                  await toggleProdClientPaye(p.id, paye);
                };
                const boundAssign = async (formData: FormData) => {
                  "use server";
                  await assignPrestataireProd(p.id, formData);
                };
                const boundUpdate = async (rowId: string, formData: FormData) => {
                  "use server";
                  await updatePrestataireProd(p.id, rowId, formData);
                };
                const boundRemove = async (rowId: string) => {
                  "use server";
                  await removePrestataireProd(p.id, rowId);
                };
                return (
                  <ProdProjetRow
                    key={p.id}
                    projet={p}
                    restant={totauxParProjet.get(p.id)?.restant ?? 0}
                    prestataires={prestataireList}
                    assignations={assignationsParProjet.get(p.id) ?? []}
                    toggleClientAction={boundToggleClient}
                    assignAction={boundAssign}
                    updateAction={boundUpdate}
                    removeAction={boundRemove}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</th>;
}
