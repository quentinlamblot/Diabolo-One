import Link from "next/link";
import type { Echeance } from "@/lib/echeances";
import { formatDateCourte } from "@/lib/echeances";

const BUCKETS: { key: "enRetard" | "aujourdhui" | "cetteSemaine"; title: string; accent: string; dot: string }[] = [
  { key: "enRetard", title: "En retard", accent: "text-red-600", dot: "bg-red-500" },
  { key: "aujourdhui", title: "Aujourd'hui", accent: "text-sand-dark", dot: "bg-sand-dark" },
  { key: "cetteSemaine", title: "Cette semaine", accent: "text-sky-dark", dot: "bg-sky-dark" },
];

export function EcheancesPanel({
  groups,
  projetNomById,
  showPrestataire,
  emptyLabel = "Rien à signaler, tout est à jour.",
}: {
  groups: { enRetard: Echeance[]; aujourdhui: Echeance[]; cetteSemaine: Echeance[] };
  projetNomById: Map<string, string>;
  showPrestataire: boolean;
  emptyLabel?: string;
}) {
  const total = groups.enRetard.length + groups.aujourdhui.length + groups.cetteSemaine.length;

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">{emptyLabel}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {BUCKETS.map(({ key, title, accent, dot }) => {
        const items = groups[key];
        return (
          <div key={key} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
              <span className="ml-auto text-xs text-zinc-400">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-zinc-400">Rien ici.</p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100">
                {items.map((e) => (
                  <Link
                    key={`${e.videoId}-${e.type}`}
                    href={`/projets/${e.projetId}/videos`}
                    className="flex flex-col gap-0.5 py-2 text-sm hover:bg-zinc-50"
                  >
                    <span className="font-medium text-zinc-900">{projetNomById.get(e.projetId) ?? "Projet"}</span>
                    <span className="text-xs text-zinc-500">{e.titre || "Vidéo sans titre"}</span>
                    <span className={`text-xs font-medium ${accent}`}>
                      {e.type === "tournage" ? "Tournage" : "Livraison"} · {formatDateCourte(e.date)}
                      {showPrestataire && e.prestataireNom && ` · ${e.prestataireNom}`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
