import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EcheancesPanel } from "@/components/EcheancesPanel";
import { AVenirPanel } from "@/components/AVenirPanel";
import {
  buildEcheances,
  buildHabillageEcheances,
  buildResponsablesMap,
  buildResponsablesGlobauxMap,
  dernierOrdre,
  groupByUrgence,
  one,
  premierStatutId,
  responsableColonne,
  type ProjetPourHabillage,
  type VideoForEcheance,
} from "@/lib/echeances";

export async function PrestataireDashboard({ prestataireId, nom }: { prestataireId: string; nom: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: videos }, { data: assignations }, { data: statutsVideo }, { data: responsablesRows }, { data: projetsHabillage }] =
    await Promise.all([
      supabase.from("videos").select("id, projet_id, titre, statut_id, date_tournage, date_livraison, statuts(ordre, label, couleur)"),
      supabase.from("projet_prestataires").select("projets(id, nom, statuts(label, couleur))").eq("prestataire_id", prestataireId),
      supabase.from("statuts").select("id, ordre, responsable_defaut:responsable_defaut_id(id, nom)").eq("type", "video"),
      supabase.from("projet_video_responsables").select("projet_id, statut_id, prestataires(id, nom)"),
      supabase
        .from("projets")
        .select("id, nom, habillage_fait, habillage_date, habillage_prestataire_id, habillage_prestataire:habillage_prestataire_id(id, nom)")
        .eq("habillage_prestataire_id", prestataireId),
    ]);

  const maxOrdre = dernierOrdre(statutsVideo ?? []);
  const premierId = premierStatutId(statutsVideo ?? []);
  const responsables = buildResponsablesMap(responsablesRows ?? []);
  const responsablesGlobaux = buildResponsablesGlobauxMap(statutsVideo ?? []);
  const toutesLesEcheances = buildEcheances(
    (videos ?? []) as VideoForEcheance[],
    maxOrdre,
    premierId,
    responsables,
    responsablesGlobaux,
    statutsVideo ?? []
  );
  // « À faire » reste strictement les échéances de l'étape où le prestataire
  // est responsable en ce moment (ex. les dates de livraison des vidéos dans
  // sa propre colonne montage) : un tournage n'est pas sa tâche, même si la
  // vidéo finira un jour chez lui. L'habillage s'y ajoute directement : c'est
  // une affectation par projet, pas une étape du pipeline vidéo.
  const habillageEcheances = buildHabillageEcheances((projetsHabillage ?? []) as ProjetPourHabillage[]);
  const echeances = [...toutesLesEcheances.filter((e) => e.prestataireId === prestataireId), ...habillageEcheances].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const groups = groupByUrgence(echeances, today);

  // « À venir » : le travail qui remonte vers lui ailleurs dans le pipeline
  // (tournage, habillage...) sans encore être de son ressort — pour anticiper
  // la charge sans le présenter comme une tâche à faire.
  const aVenir = toutesLesEcheances
    .filter((e) => e.prestataireId !== prestataireId && e.prestataireIds.includes(prestataireId))
    .sort((a, b) => a.date.localeCompare(b.date));

  const nombreDansMaCase = (videos ?? []).filter((v) => {
    const statut = one(v.statuts);
    if (!statut || statut.ordre >= maxOrdre) return false;
    const resp = responsableColonne(responsables, v.projet_id, v.statut_id, responsablesGlobaux);
    return resp?.id === prestataireId;
  }).length;

  const projetNomById = new Map<string, string>();
  for (const a of assignations ?? []) {
    const projet = Array.isArray(a.projets) ? a.projets[0] : a.projets;
    if (projet) projetNomById.set(projet.id, projet.nom);
  }
  // Un prestataire peut être assigné à l'habillage d'un projet sans être
  // dans sa liste de "prestataires affectés" : sans ça le nom du projet
  // n'apparaîtrait pas dans son échéance.
  for (const p of projetsHabillage ?? []) {
    projetNomById.set(p.id, p.nom);
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
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">À faire</h2>
          {nombreDansMaCase > 0 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {nombreDansMaCase} vidéo(s) dans votre case
            </span>
          )}
        </div>
        <EcheancesPanel
          groups={groups}
          projetNomById={projetNomById}
          showPrestataire={false}
          emptyLabel="Aucune échéance sur vos vidéos pour le moment."
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Bientôt (pas encore à vous)</h2>
        <AVenirPanel echeances={aVenir} projetNomById={projetNomById} />
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
