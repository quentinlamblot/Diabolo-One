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
  type: "tournage" | "livraison";
  date: string;
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

// Une échéance de tournage n'a de sens que tant que le tournage n'a pas eu
// lieu (1ère étape du pipeline) ; une échéance de livraison reste valable
// tant que la vidéo n'est pas à la dernière étape. Le responsable de
// chacune est celui affecté à la colonne concernée (1ère colonne pour le
// tournage, colonne actuelle pour la livraison).
export function buildEcheances(
  videos: VideoForEcheance[],
  maxOrdre: number,
  premierStatutIdVideo: string | null,
  responsables: ResponsablesParColonne,
  responsablesGlobaux?: ResponsablesGlobauxParColonne
): Echeance[] {
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
        type: "tournage",
        date: v.date_tournage,
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
        type: "livraison",
        date: v.date_livraison,
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
