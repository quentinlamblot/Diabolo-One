import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/Badge";
import { EcheancesPanel } from "@/components/EcheancesPanel";
import { buildEcheances, dernierOrdre, groupByUrgence, one, type VideoForEcheance } from "@/lib/echeances";

interface ProjetRow {
  id: string;
  nom: string;
  nombre_commande: number;
  clients: { nom: string } | { nom: string }[] | null;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
}

export async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: projets }, { data: videos }, { data: statutsVideo }] = await Promise.all([
    supabase.from("projets").select("id, nom, nombre_commande, clients(nom), statuts(label, couleur)").order("created_at", { ascending: false }),
    supabase
      .from("videos")
      .select(
        "id, projet_id, titre, date_tournage, date_livraison, statuts(ordre, label, couleur), prestataire_tournage:prestataire_tournage_id(id, nom), prestataire_montage:prestataire_montage_id(id, nom)"
      ),
    supabase.from("statuts").select("ordre").eq("type", "video"),
  ]);

  const projetList = (projets ?? []) as ProjetRow[];
  const videoList = (videos ?? []) as VideoForEcheance[];
  const projetNomById = new Map(projetList.map((p) => [p.id, p.nom]));
  const maxOrdre = dernierOrdre(statutsVideo ?? []);

  const echeances = buildEcheances(videoList, maxOrdre);
  const groups = groupByUrgence(echeances, today);

  const parProjet = new Map<string, { total: number; livrees: number; parStatut: Map<string, { count: number; couleur: string }> }>();
  for (const v of videoList) {
    const statut = one(v.statuts);
    const entry = parProjet.get(v.projet_id) ?? { total: 0, livrees: 0, parStatut: new Map() };
    entry.total += 1;
    if (statut && statut.ordre >= maxOrdre) entry.livrees += 1;
    if (statut) {
      const s = entry.parStatut.get(statut.label) ?? { count: 0, couleur: statut.couleur };
      s.count += 1;
      entry.parStatut.set(statut.label, s);
    }
    parProjet.set(v.projet_id, entry);
  }

  // Charge de travail : une vidéo pas encore tournée (1ère étape) est le
  // travail actif du tourneur, une vidéo tournée mais pas encore livrée
  // (étapes intermédiaires) est celui du monteur — chacun ne voit que ce
  // qui est réellement dans son camp.
  const charge = new Map<string, { nom: string; actives: number; enRetard: number }>();
  function ajouterCharge(presta: { id: string; nom: string } | null, enRetard: boolean) {
    const key = presta?.id ?? "__non_assigne__";
    const entry = charge.get(key) ?? { nom: presta?.nom ?? "Non assigné", actives: 0, enRetard: 0 };
    entry.actives += 1;
    if (enRetard) entry.enRetard += 1;
    charge.set(key, entry);
  }
  for (const v of videoList) {
    const statut = one(v.statuts);
    if (!statut || statut.ordre >= maxOrdre) continue;
    if (statut.ordre === 0) {
      ajouterCharge(one(v.prestataire_tournage), !!(v.date_tournage && v.date_tournage < today));
    } else {
      ajouterCharge(one(v.prestataire_montage), !!(v.date_livraison && v.date_livraison < today));
    }
  }
  const chargeList = Array.from(charge.values()).sort((a, b) => b.actives - a.actives);

  return (
    <div className="relative flex flex-col gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky/15 blur-2xl"
      />
      <div className="relative">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Tableau de bord <span className="ml-1 inline-block h-2 w-2 rounded-full bg-sand align-middle" />
        </h1>
        <p className="text-sm text-zinc-500">Ce qu'il y a à faire, au jour le jour</p>
      </div>

      <section className="relative">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">À faire</h2>
        <EcheancesPanel groups={groups} projetNomById={projetNomById} showPrestataire />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Projets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetList.map((p) => {
            const stats = parProjet.get(p.id);
            const client = one(p.clients);
            const statut = one(p.statuts);
            const total = stats?.total ?? 0;
            return (
              <Link
                key={p.id}
                href={`/projets/${p.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-sky-dark"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{p.nom}</p>
                    <p className="text-xs text-zinc-500">{client?.nom ?? "—"}</p>
                  </div>
                  {statut && <Badge label={statut.label} color={statut.couleur} />}
                </div>
                {total > 0 && (
                  <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
                    {Array.from(stats!.parStatut.entries()).map(([label, { count, couleur }]) => (
                      <div key={label} style={{ width: `${(count / total) * 100}%`, backgroundColor: couleur }} title={label} />
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  {stats?.livrees ?? 0} livrée(s) / {p.nombre_commande} commandée(s)
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Charge de travail par prestataire</h2>
        {chargeList.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune vidéo en cours.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {chargeList.map((c) => (
              <div key={c.nom} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-zinc-900">{c.nom}</span>
                <span className="text-zinc-500">
                  {c.actives} vidéo(s) en cours
                  {c.enRetard > 0 && <span className="ml-2 font-medium text-red-600">{c.enRetard} en retard</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
