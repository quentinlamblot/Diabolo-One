export interface VideoForEcheance {
  id: string;
  projet_id: string;
  titre: string | null;
  statut_id: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  statuts: { ordre: number; label: string; couleur: string } | { ordre: number; label: string; couleur: string }[] | null;
}

export interface Echeance {
  videoId: string;
  projetId: string;
  titre: string | null;
  prestataireId: string | null;
  prestataireNom: string | null;
  // Tous les prestataires responsables d'une colonne du pipeline de ce
  // projet (pas seulement celui de l'étape actuelle de la vidéo) : tant
  // qu'une vidéo est en cours, chacun d'eux est responsable de sa livraison
  // dans les temps et doit voir son échéance.
  prestataireIds: string[];
  type: "tournage" | "livraison";
  date: string;
  // Étape actuelle de la vidéo (ex. "Habillage", "En montage"), pour
  // distinguer un simple aperçu du travail à venir ailleurs dans le pipeline
  // d'une échéance qui concerne réellement l'étape du prestataire.
  statutLabel: string | null;
  statutCouleur: string | null;
}

export interface ResponsableEntry {
  id: string;
  nom: string;
}

// Clé composite projet+colonne : le responsable d'une vidéo dépend de la
// colonne où elle se trouve *pour ce projet* (chaque projet peut affecter
// des personnes différentes à la même colonne).
export type ResponsablesParColonne = Map<string, ResponsableEntry>;

function cle(projetId: string, statutId: string): string {
  return `${projetId}:${statutId}`;
}

export function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function buildResponsablesMap(
  rows: { projet_id: string; statut_id: string; prestataires: { id: string; nom: string } | { id: string; nom: string }[] | null }[]
): ResponsablesParColonne {
  const map: ResponsablesParColonne = new Map();
  for (const r of rows) {
    const p = one(r.prestataires);
    if (p) map.set(cle(r.projet_id, r.statut_id), p);
  }
  return map;
}

// Responsable par défaut global d'une colonne (Gestion > Statuts), utilisé
// pour tout projet qui n'a pas défini son propre responsable pour cette
// colonne dans projet_video_responsables.
export type ResponsablesGlobauxParColonne = Map<string, ResponsableEntry>;

export function buildResponsablesGlobauxMap(
  statuts: { id: string; responsable_defaut: { id: string; nom: string } | { id: string; nom: string }[] | null }[]
): ResponsablesGlobauxParColonne {
  const map: ResponsablesGlobauxParColonne = new Map();
  for (const s of statuts) {
    const p = one(s.responsable_defaut);
    if (p) map.set(s.id, p);
  }
  return map;
}

export function responsableColonne(
  responsables: ResponsablesParColonne,
  projetId: string,
  statutId: string | null,
  responsablesGlobaux?: ResponsablesGlobauxParColonne
): ResponsableEntry | null {
  if (!statutId) return null;
  return responsables.get(cle(projetId, statutId)) ?? responsablesGlobaux?.get(statutId) ?? null;
}

// Les statuts vidéo sont personnalisables par l'admin (libellé, couleur) :
// on identifie donc "pas encore tourné" / "livré" par leur position dans le
// pipeline (ordre) plutôt que par leur libellé, qui peut changer.
export function dernierOrdre(statuts: { ordre: number }[]): number {
  return statuts.length > 0 ? Math.max(...statuts.map((s) => s.ordre)) : 0;
}

export function premierStatutId(statuts: { id: string; ordre: number }[]): string | null {
  if (statuts.length === 0) return null;
  return statuts.reduce((min, s) => (s.ordre < min.ordre ? s : min)).id;
}

// Tous les prestataires affectés à une colonne du pipeline vidéo pour ce
// projet (responsable spécifique au projet, sinon défaut global de la
// colonne) : chacun d'eux partage la responsabilité de livrer la vidéo dans
// les temps, pas seulement celui de l'étape où elle se trouve actuellement.
function prestatairesPipeline(
  projetId: string,
  statutsPipeline: { id: string }[],
  responsables: ResponsablesParColonne,
  responsablesGlobaux?: ResponsablesGlobauxParColonne
): ResponsableEntry[] {
  const parId = new Map<string, ResponsableEntry>();
  for (const s of statutsPipeline) {
    const r = responsableColonne(responsables, projetId, s.id, responsablesGlobaux);
    if (r) parId.set(r.id, r);
  }
  return Array.from(parId.values());
}

// Une échéance de tournage n'a de sens que tant que le tournage n'a pas eu
// lieu (1ère étape du pipeline) ; une échéance de livraison reste valable
// tant que la vidéo n'est pas à la dernière étape. Le responsable "principal"
// affiché est celui de la colonne concernée, mais l'échéance est aussi
// rattachée à tous les autres prestataires du pipeline de ce projet, car
// tous sont responsables de la livraison dans les temps.
export function buildEcheances(
  videos: VideoForEcheance[],
  maxOrdre: number,
  premierStatutIdVideo: string | null,
  responsables: ResponsablesParColonne,
  responsablesGlobaux?: ResponsablesGlobauxParColonne,
  statutsVideoPipeline?: { id: string; ordre: number }[]
): Echeance[] {
  const statutsPipeline = (statutsVideoPipeline ?? []).filter((s) => s.ordre < maxOrdre);
  const pipelineParProjet = new Map<string, ResponsableEntry[]>();
  function prestatairesDuProjet(projetId: string): string[] {
    if (!pipelineParProjet.has(projetId)) {
      pipelineParProjet.set(projetId, prestatairesPipeline(projetId, statutsPipeline, responsables, responsablesGlobaux));
    }
    return pipelineParProjet.get(projetId)!.map((r) => r.id);
  }

  const echeances: Echeance[] = [];
  for (const v of videos) {
    const statut = one(v.statuts);
    if (statut && statut.ordre >= maxOrdre) continue;

    if (v.date_tournage && statut?.ordre === 0) {
      const resp = responsableColonne(responsables, v.projet_id, premierStatutIdVideo, responsablesGlobaux);
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: resp?.id ?? null,
        prestataireNom: resp?.nom ?? null,
        prestataireIds: prestatairesDuProjet(v.projet_id),
        type: "tournage",
        date: v.date_tournage,
        statutLabel: statut?.label ?? null,
        statutCouleur: statut?.couleur ?? null,
      });
    }
    if (v.date_livraison) {
      const resp = responsableColonne(responsables, v.projet_id, v.statut_id, responsablesGlobaux);
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: resp?.id ?? null,
        prestataireNom: resp?.nom ?? null,
        prestataireIds: prestatairesDuProjet(v.projet_id),
        type: "livraison",
        date: v.date_livraison,
        statutLabel: statut?.label ?? null,
        statutCouleur: statut?.couleur ?? null,
      });
    }
  }
  return echeances.sort((a, b) => a.date.localeCompare(b.date));
}

export function groupByUrgence(echeances: Echeance[], today: string) {
  const dans7j = new Date(today);
  dans7j.setDate(dans7j.getDate() + 7);
  const dans7jStr = dans7j.toISOString().slice(0, 10);

  return {
    enRetard: echeances.filter((e) => e.date < today),
    aujourdhui: echeances.filter((e) => e.date === today),
    cetteSemaine: echeances.filter((e) => e.date > today && e.date <= dans7jStr),
  };
}

export function formatDateCourte(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}
