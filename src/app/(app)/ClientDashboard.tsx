import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/Badge";

interface VideoRow {
  projet_id: string;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
}

interface ProjetRow {
  id: string;
  nom: string;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
  nombre_commande: number;
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function ClientDashboard({ clientId, nom }: { clientId: string; nom: string }) {
  const supabase = await createClient();

  const [{ data: projets }, { data: videos }] = await Promise.all([
    supabase
      .from("projets")
      .select("id, nom, nombre_commande, statuts(label, couleur)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("videos").select("projet_id, statuts(label, couleur)"),
  ]);

  const projetList = (projets ?? []) as ProjetRow[];
  const projetIds = new Set(projetList.map((p) => p.id));

  const parProjet = new Map<string, { total: number; livrees: number; parStatut: Map<string, { count: number; couleur: string }> }>();
  for (const v of (videos ?? []) as VideoRow[]) {
    if (!projetIds.has(v.projet_id)) continue;
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Bonjour {nom}</h1>
        <p className="text-sm text-zinc-500">Voici l'avancement de vos projets vidéo</p>
      </div>

      {projetList.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun projet pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projetList.map((p) => {
            const stats = parProjet.get(p.id);
            const statut = one(p.statuts);
            const total = stats?.total ?? 0;
            return (
              <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-zinc-900">{p.nom}</p>
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
                <div className="mt-1 flex gap-2">
                  <Link
                    href={`/projets/${p.id}/videos`}
                    className="rounded-full bg-navy px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-dark"
                  >
                    Vidéos
                  </Link>
                  <Link
                    href={`/projets/${p.id}/contacts`}
                    className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                  >
                    Suivi des contacts
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
