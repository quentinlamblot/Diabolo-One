import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/Badge";

interface VideoRow {
  id: string;
  projet_id: string;
  titre: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
  prestataires: { id: string; nom: string } | { id: string; nom: string }[] | null;
}

interface ProjetRow {
  id: string;
  nom: string;
  nombre_commande: number;
  clients: { nom: string } | { nom: string }[] | null;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function Dashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: projets }, { data: videos }] = await Promise.all([
    supabase.from("projets").select("id, nom, nombre_commande, clients(nom), statuts(label, couleur)").order("created_at", { ascending: false }),
    supabase
      .from("videos")
      .select("id, projet_id, titre, date_tournage, date_livraison, statuts(label, couleur), prestataires(id, nom)"),
  ]);

  const projetList = (projets ?? []) as ProjetRow[];
  const videoList = (videos ?? []) as VideoRow[];
  const projetById = new Map(projetList.map((p) => [p.id, p]));

  const enRetard = videoList
    .map((v) => {
      const statut = one(v.statuts);
      const tournageEnRetard = statut?.label !== "Livré" && !!v.date_tournage && v.date_tournage < today;
      const livraisonEnRetard = statut?.label !== "Livré" && !!v.date_livraison && v.date_livraison < today;
      return { ...v, tournageEnRetard, livraisonEnRetard };
    })
    .filter((v) => v.tournageEnRetard || v.livraisonEnRetard)
    .sort((a, b) => {
      const da = a.tournageEnRetard ? a.date_tournage! : a.date_livraison!;
      const db = b.tournageEnRetard ? b.date_tournage! : b.date_livraison!;
      return da.localeCompare(db);
    });

  const parProjet = new Map<string, { total: number; livrees: number; parStatut: Map<string, { count: number; couleur: string }> }>();
  for (const v of videoList) {
    const statut = one(v.statuts);
    const entry = parProjet.get(v.projet_id) ?? { total: 0, livrees: 0, parStatut: new Map() };
    entry.total += 1;
    if (statut?.label === "Livré") entry.livrees += 1;
    if (statut) {
      const s = entry.parStatut.get(statut.label) ?? { count: 0, couleur: statut.couleur };
      s.count += 1;
      entry.parStatut.set(statut.label, s);
    }
    parProjet.set(v.projet_id, entry);
  }

  const charge = new Map<string, { nom: string; actives: number; enRetard: number }>();
  for (const v of videoList) {
    const statut = one(v.statuts);
    if (statut?.label === "Livré") continue;
    const presta = one(v.prestataires);
    const key = presta?.id ?? "__non_assigne__";
    const entry = charge.get(key) ?? { nom: presta?.nom ?? "Non assigné", actives: 0, enRetard: 0 };
    entry.actives += 1;
    if ((v.date_tournage && v.date_tournage < today) || (v.date_livraison && v.date_livraison < today)) {
      entry.enRetard += 1;
    }
    charge.set(key, entry);
  }
  const chargeList = Array.from(charge.values()).sort((a, b) => b.actives - a.actives);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Tableau de bord</h1>
        <p className="text-sm text-zinc-500">Vue d'ensemble de tous les projets</p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">
          En retard <span className="font-normal text-zinc-400">({enRetard.length})</span>
        </h2>
        {enRetard.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune vidéo en retard.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {enRetard.map((v) => {
              const projet = projetById.get(v.projet_id);
              const presta = one(v.prestataires);
              return (
                <Link
                  key={v.id}
                  href={`/projets/${v.projet_id}/videos`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-zinc-50"
                >
                  <div>
                    <span className="font-medium text-zinc-900">{projet?.nom ?? "Projet"}</span>
                    <span className="text-zinc-400"> · {v.titre || "Vidéo sans titre"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-500">
                    {presta && <span>{presta.nom}</span>}
                    {v.tournageEnRetard && (
                      <span className="font-medium text-red-600">Tournage {formatDate(v.date_tournage!)}</span>
                    )}
                    {v.livraisonEnRetard && (
                      <span className="font-medium text-red-600">Livraison {formatDate(v.date_livraison!)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 hover:border-sky-dark"
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

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
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

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}
