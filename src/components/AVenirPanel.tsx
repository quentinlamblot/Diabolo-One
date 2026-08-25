import Link from "next/link";
import type { Echeance } from "@/lib/echeances";
import { formatDateCourte } from "@/lib/echeances";

// Contrairement à EcheancesPanel (urgence : en retard / aujourd'hui / cette
// semaine, pour des tâches à faire par le prestataire), ce panneau montre le
// travail qui remonte vers lui sans encore être de son ressort — un simple
// aperçu pour anticiper la charge, sans alarme ni tri par urgence.
export function AVenirPanel({
  echeances,
  projetNomById,
}: {
  echeances: Echeance[];
  projetNomById: Map<string, string>;
}) {
  if (echeances.length === 0) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Rien à l&apos;horizon pour le moment.</div>;
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
      {echeances.map((e) => (
        <Link
          key={`${e.videoId}-${e.type}`}
          href={`/projets/${e.projetId}/videos`}
          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-50"
        >
          {e.statutLabel && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${e.statutCouleur ?? "#94a3b8"}22`, color: e.statutCouleur ?? "#64748b" }}
            >
              {e.statutLabel}
            </span>
          )}
          <span className="flex-1 truncate">
            <span className="font-medium text-zinc-900">{projetNomById.get(e.projetId) ?? "Projet"}</span>
            <span className="text-zinc-400"> · </span>
            <span className="text-zinc-500">{e.titre || "Vidéo sans titre"}</span>
          </span>
          <span className="shrink-0 text-xs text-zinc-400">{formatDateCourte(e.date)}</span>
        </Link>
      ))}
    </div>
  );
}
