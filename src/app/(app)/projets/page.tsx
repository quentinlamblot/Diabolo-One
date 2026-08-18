import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import Link from "next/link";
import type { Projet } from "@/types/database";

export default async function ProjetsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: projets, error }, { data: videos }] = await Promise.all([
    supabase.from("projets").select("*, clients(*), offres(*), statuts(*)").order("created_at", { ascending: false }),
    supabase.from("videos").select("projet_id, statuts(label)"),
  ]);

  if (error) {
    return <p className="text-sm text-red-600">Erreur de chargement : {error.message}</p>;
  }

  const list = (projets ?? []) as Projet[];

  const livreesParProjet = new Map<string, number>();
  for (const v of videos ?? []) {
    const statut = Array.isArray(v.statuts) ? v.statuts[0] : v.statuts;
    if (statut?.label === "Livré") {
      livreesParProjet.set(v.projet_id, (livreesParProjet.get(v.projet_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Projets <span className="ml-1 inline-block h-2 w-2 rounded-full bg-sky align-middle" />
          </h1>
          <p className="text-sm text-zinc-500">
            {list.length} projet{list.length > 1 ? "s" : ""}
          </p>
        </div>
        {profile.role === "admin" && (
          <Link
            href="/projets/nouveau"
            className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark"
          >
            + Nouveau projet
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun projet pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-sky/10">
              <tr>
                <Th>Projet</Th>
                <Th>Client</Th>
                <Th>Offre</Th>
                <Th>Format</Th>
                <Th>Statut</Th>
                <Th>Charte</Th>
                <Th>Vidéos</Th>
                <Th>Contacts</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                    <Link href={`/projets/${p.id}`} className="hover:underline">
                      {p.nom}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    {p.clients?.nom ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    {p.offres?.nom ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.format}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.statuts ? (
                      <Badge label={p.statuts.label} color={p.statuts.couleur} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge
                      label={p.charte_graphique === "ok" ? "OK" : "En attente"}
                      color={p.charte_graphique === "ok" ? "#22c55e" : "#f59e0b"}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                    <Link href={`/projets/${p.id}/videos`} className="hover:underline">
                      {livreesParProjet.get(p.id) ?? 0} livrée(s) / {p.nombre_commande} commandée(s)
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      href={`/projets/${p.id}/contacts`}
                      className="text-sm font-medium text-sky-dark hover:underline"
                    >
                      Voir la liste
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${className}`}
    >
      {children}
    </th>
  );
}
