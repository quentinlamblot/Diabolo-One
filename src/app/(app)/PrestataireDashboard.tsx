import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EcheancesPanel } from "@/components/EcheancesPanel";
import { buildEcheances, dernierOrdre, groupByUrgence, type VideoForEcheance } from "@/lib/echeances";

export async function PrestataireDashboard({ prestataireId, nom }: { prestataireId: string; nom: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: videos }, { data: assignations }, { data: statutsVideo }] = await Promise.all([
    supabase
      .from("videos")
      .select(
        "id, projet_id, titre, date_tournage, date_livraison, statuts(ordre, label, couleur), prestataire_tournage:prestataire_tournage_id(id, nom), prestataire_montage:prestataire_montage_id(id, nom)"
      ),
    supabase.from("projet_prestataires").select("projets(id, nom, statuts(label, couleur))").eq("prestataire_id", prestataireId),
    supabase.from("statuts").select("ordre").eq("type", "video"),
  ]);

  const maxOrdre = dernierOrdre(statutsVideo ?? []);
  const toutesLesEcheances = buildEcheances((videos ?? []) as VideoForEcheance[], maxOrdre);
  const echeances = toutesLesEcheances.filter((e) => e.prestataireId === prestataireId);
  const groups = groupByUrgence(echeances, today);

  const projetNomById = new Map<string, string>();
  for (const a of assignations ?? []) {
    const projet = Array.isArray(a.projets) ? a.projets[0] : a.projets;
    if (projet) projetNomById.set(projet.id, projet.nom);
  }

  const mesProjets = (assignations ?? [])
    .map((a) => (Array.isArray(a.projets) ? a.projets[0] : a.projets))
    .filter((p) => !!p) as { id: string; nom: string }[];

  return (
    <div className="relative flex flex-col gap-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky/15 blur-2xl"
      />
      <div className="relative">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Bonjour {nom} <span className="ml-1 inline-block h-2 w-2 rounded-full bg-sand align-middle" />
        </h1>
        <p className="text-sm text-zinc-500">Voici ce qu'il y a à faire, au jour le jour</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">À faire</h2>
        <EcheancesPanel
          groups={groups}
          projetNomById={projetNomById}
          showPrestataire={false}
          emptyLabel="Aucune échéance sur vos vidéos pour le moment."
        />
      </section>

      {mesProjets.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Mes projets actifs</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mesProjets.map((p) => (
              <Link
                key={p.id}
                href={`/projets/${p.id}/videos`}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 transition-colors hover:border-sky-dark"
              >
                {p.nom}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
