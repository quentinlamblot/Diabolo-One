import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import type { Prestataire, ProdProjetPrestataire, TachePrestataire } from "@/types/database";
import { toggleProjetClientPaye } from "../../projets/actions";
import { toggleTachePaye } from "../../admin/paiements/actions";
import { toggleProdClientPaye, assignPrestataireProd, updatePrestataireProd, removePrestataireProd } from "../actions";
import { FinanceRowClassique } from "./FinanceRowClassique";
import { FinanceRowProd } from "./FinanceRowProd";

function formatEuros(n: number) {
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

interface Ligne {
  id: string;
  nom: string;
  href: string;
  client: string | null;
  facture: number;
  encaisse: boolean;
  du: number;
  restantDu: number;
}

interface LigneCategorie {
  label: string;
  systeme: "Remoteo" | "Diabolo Prod";
  facture: number;
  du: number;
}

export default async function FinancesPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: projetsClassique }, { data: tachesClassique }, { data: projetsProd }, { data: assignationsProd }, { data: prestataires }] =
    await Promise.all([
      supabase.from("projets").select("id, nom, date_paiement_client, clients(nom), offres(nom, prix)"),
      supabase.from("taches_prestataires").select("*, prestataires(*)"),
      supabase.from("prod_projets").select("id, nom, client, valeur_deal, date_paiement_client, type_prestation"),
      supabase.from("prod_projet_prestataires").select("*, prestataires(*)"),
      supabase.from("prestataires").select("*").order("nom"),
    ]);

  const prestataireList = (prestataires ?? []) as Prestataire[];

  // Remoteo : ce que doivent les prestataires, par projet.
  const tachesParProjet = new Map<string, TachePrestataire[]>();
  const duParProjetClassique = new Map<string, { du: number; restant: number }>();
  let totalDuClassique = 0;
  let totalPayeClassique = 0;
  for (const t of (tachesClassique ?? []) as TachePrestataire[]) {
    const montant = Number(t.montant ?? 0);
    totalDuClassique += montant;
    if (t.paye) totalPayeClassique += montant;
    if (t.projet_id) {
      const entry = duParProjetClassique.get(t.projet_id) ?? { du: 0, restant: 0 };
      entry.du += montant;
      if (!t.paye) entry.restant += montant;
      duParProjetClassique.set(t.projet_id, entry);

      const liste = tachesParProjet.get(t.projet_id) ?? [];
      liste.push(t);
      tachesParProjet.set(t.projet_id, liste);
    }
  }

  // Diabolo Prod : ce que doivent les prestataires, par projet.
  const assignationsParProjetProd = new Map<string, ProdProjetPrestataire[]>();
  const duParProjetProd = new Map<string, { du: number; restant: number }>();
  let totalDuProd = 0;
  let totalPayeProd = 0;
  for (const a of (assignationsProd ?? []) as ProdProjetPrestataire[]) {
    const montant = Number(a.montant_du ?? 0);
    totalDuProd += montant;
    if (a.date_paiement) totalPayeProd += montant;
    const entry = duParProjetProd.get(a.prod_projet_id) ?? { du: 0, restant: 0 };
    entry.du += montant;
    if (!a.date_paiement) entry.restant += montant;
    duParProjetProd.set(a.prod_projet_id, entry);

    const liste = assignationsParProjetProd.get(a.prod_projet_id) ?? [];
    liste.push(a);
    assignationsParProjetProd.set(a.prod_projet_id, liste);
  }

  const lignesClassique: Ligne[] = [];
  const lignesCategoriesMap = new Map<string, LigneCategorie>();

  let totalFactureClassique = 0;
  let totalEncaisseClassique = 0;
  for (const p of projetsClassique ?? []) {
    const client = one(p.clients);
    const offre = one(p.offres);
    // Le montant facturé au client est celui de l'offre associée au
    // projet : pas de champ séparé à ressaisir.
    const facture = Number(offre?.prix ?? 0);
    const encaisse = !!p.date_paiement_client;
    totalFactureClassique += facture;
    if (encaisse) totalEncaisseClassique += facture;
    const du = duParProjetClassique.get(p.id)?.du ?? 0;
    const restantDu = duParProjetClassique.get(p.id)?.restant ?? 0;

    lignesClassique.push({
      id: p.id,
      nom: p.nom,
      href: `/projets/${p.id}`,
      client: client?.nom ?? null,
      facture,
      encaisse,
      du,
      restantDu,
    });

    const label = offre?.nom ?? "Sans offre";
    const cat = lignesCategoriesMap.get(`remoteo:${label}`) ?? { label, systeme: "Remoteo" as const, facture: 0, du: 0 };
    cat.facture += facture;
    cat.du += du;
    lignesCategoriesMap.set(`remoteo:${label}`, cat);
  }

  const lignesProd: Ligne[] = [];
  let totalFactureProd = 0;
  let totalEncaisseProd = 0;
  for (const p of projetsProd ?? []) {
    const facture = Number(p.valeur_deal ?? 0);
    const encaisse = !!p.date_paiement_client;
    totalFactureProd += facture;
    if (encaisse) totalEncaisseProd += facture;
    const du = duParProjetProd.get(p.id)?.du ?? 0;
    const restantDu = duParProjetProd.get(p.id)?.restant ?? 0;

    lignesProd.push({
      id: p.id,
      nom: p.nom,
      href: `/prod/${p.id}`,
      client: p.client,
      facture,
      encaisse,
      du,
      restantDu,
    });

    const label = p.type_prestation ?? "Sans type";
    const cat = lignesCategoriesMap.get(`prod:${label}`) ?? { label, systeme: "Diabolo Prod" as const, facture: 0, du: 0 };
    cat.facture += facture;
    cat.du += du;
    lignesCategoriesMap.set(`prod:${label}`, cat);
  }

  // Les dossiers non résolus (client pas encore payé, ou prestataires pas
  // encore réglés) remontent en premier : c'est ce qui demande une action.
  function parUrgence(a: Ligne, b: Ligne) {
    const nonResoluA = !a.encaisse || a.restantDu > 0 ? 0 : 1;
    const nonResoluB = !b.encaisse || b.restantDu > 0 ? 0 : 1;
    if (nonResoluA !== nonResoluB) return nonResoluA - nonResoluB;
    return b.facture - a.facture;
  }
  lignesClassique.sort(parUrgence);
  lignesProd.sort(parUrgence);

  const lignesCategories = Array.from(lignesCategoriesMap.values())
    .filter((c) => c.facture > 0 || c.du > 0)
    .sort((a, b) => b.facture - a.facture);

  const totalFacture = totalFactureClassique + totalFactureProd;
  const totalEncaisse = totalEncaisseClassique + totalEncaisseProd;
  const totalDu = totalDuClassique + totalDuProd;
  const totalPaye = totalPayeClassique + totalPayeProd;
  const resteAEncaisser = totalFacture - totalEncaisse;
  const resteAPayer = totalDu - totalPaye;
  const margePrevisionnelle = totalFacture - totalDu;
  const tresorerieNette = totalEncaisse - totalPaye;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/prod" className="text-sm text-zinc-500 hover:underline">
          ← Diabolo Prod
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Finances</h1>
        <p className="text-sm text-zinc-500">Remoteo + Diabolo Prod, ce qu&apos;on vous doit et ce que vous devez</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tuile label="Facturé aux clients" valeur={formatEuros(totalFacture)} />
        <Tuile label="Reste à encaisser" valeur={formatEuros(resteAEncaisser)} accent={resteAEncaisser > 0 ? "text-orange-600" : undefined} />
        <Tuile label="Dû aux prestataires" valeur={formatEuros(totalDu)} />
        <Tuile label="Reste à payer" valeur={formatEuros(resteAPayer)} accent={resteAPayer > 0 ? "text-orange-600" : undefined} />
        <Tuile label="Encaissé" valeur={formatEuros(totalEncaisse)} accent="text-emerald-600" />
        <Tuile label="Payé aux prestataires" valeur={formatEuros(totalPaye)} accent="text-emerald-600" />
        <Tuile label="Marge prévisionnelle" valeur={formatEuros(margePrevisionnelle)} tooltip="Facturé − dû, tout compris que ce soit réglé ou non" />
        <Tuile label="Trésorerie nette" valeur={formatEuros(tresorerieNette)} tooltip="Encaissé − payé, ce qui a réellement bougé" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Remoteo</h2>
          <SousTotal label="Facturé" valeur={totalFactureClassique} />
          <SousTotal label="Encaissé" valeur={totalEncaisseClassique} />
          <SousTotal label="Dû aux prestataires" valeur={totalDuClassique} />
          <SousTotal label="Payé aux prestataires" valeur={totalPayeClassique} />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Diabolo Prod</h2>
          <SousTotal label="Facturé" valeur={totalFactureProd} />
          <SousTotal label="Encaissé" valeur={totalEncaisseProd} />
          <SousTotal label="Dû aux prestataires" valeur={totalDuProd} />
          <SousTotal label="Payé aux prestataires" valeur={totalPayeProd} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Par offre / type de prestation</h2>
        {lignesCategories.length === 0 ? (
          <p className="text-sm text-zinc-500">Rien à afficher pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Catégorie</Th>
                  <Th>Système</Th>
                  <Th>Facturé</Th>
                  <Th>Dû prestataires</Th>
                  <Th>Marge</Th>
                  <Th>Marge %</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lignesCategories.map((c) => {
                  const marge = c.facture - c.du;
                  const margePct = c.facture > 0 ? (marge / c.facture) * 100 : null;
                  return (
                    <tr key={`${c.systeme}:${c.label}`} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900">{c.label}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">{c.systeme}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{formatEuros(c.facture)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{formatEuros(c.du)}</td>
                      <td className={`whitespace-nowrap px-4 py-2.5 font-medium ${marge >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatEuros(marge)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">{margePct === null ? "—" : `${margePct.toFixed(0)} %`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Remoteo — par projet</h2>
        {lignesClassique.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun projet pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Projet</Th>
                  <Th>Client</Th>
                  <Th>Facturé</Th>
                  <Th>Statut client</Th>
                  <Th>Dû prestataires</Th>
                  <Th>Reste à payer</Th>
                  <Th>Marge</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lignesClassique.map((l) => {
                  const boundToggleClient = async (paye: boolean) => {
                    "use server";
                    await toggleProjetClientPaye(l.id, paye);
                  };
                  const boundToggleTache = async (tacheId: string, paye: boolean) => {
                    "use server";
                    await toggleTachePaye(tacheId, paye);
                  };
                  return (
                    <FinanceRowClassique
                      key={l.id}
                      ligne={l}
                      taches={tachesParProjet.get(l.id) ?? []}
                      toggleClientAction={boundToggleClient}
                      toggleTacheAction={boundToggleTache}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Diabolo Prod — par projet</h2>
        {lignesProd.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun projet pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Projet</Th>
                  <Th>Client</Th>
                  <Th>Facturé</Th>
                  <Th>Statut client</Th>
                  <Th>Dû prestataires</Th>
                  <Th>Reste à payer</Th>
                  <Th>Marge</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lignesProd.map((l) => {
                  const boundToggleClient = async (paye: boolean) => {
                    "use server";
                    await toggleProdClientPaye(l.id, paye);
                  };
                  const boundAssign = async (formData: FormData) => {
                    "use server";
                    await assignPrestataireProd(l.id, formData);
                  };
                  const boundUpdate = async (rowId: string, formData: FormData) => {
                    "use server";
                    await updatePrestataireProd(l.id, rowId, formData);
                  };
                  const boundRemove = async (rowId: string) => {
                    "use server";
                    await removePrestataireProd(l.id, rowId);
                  };
                  return (
                    <FinanceRowProd
                      key={l.id}
                      ligne={l}
                      prestataires={prestataireList}
                      assignations={assignationsParProjetProd.get(l.id) ?? []}
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
    </div>
  );
}

function Tuile({ label, valeur, accent, tooltip }: { label: string; valeur: string; accent?: string; tooltip?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4" title={tooltip}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ?? "text-zinc-900"}`}>{valeur}</p>
    </div>
  );
}

function SousTotal({ label, valeur }: { label: string; valeur: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{formatEuros(valeur)}</span>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</th>;
}
