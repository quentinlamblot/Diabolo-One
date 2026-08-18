export interface VideoForEcheance {
  id: string;
  projet_id: string;
  titre: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  statuts: { ordre: number; label: string; couleur: string } | { ordre: number; label: string; couleur: string }[] | null;
  prestataire_tournage: { id: string; nom: string } | { id: string; nom: string }[] | null;
  prestataire_montage: { id: string; nom: string } | { id: string; nom: string }[] | null;
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

export function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

// Les statuts vidéo sont personnalisables par l'admin (libellé, couleur) :
// on identifie donc "pas encore tourné" / "livré" par leur position dans le
// pipeline (ordre) plutôt que par leur libellé, qui peut changer.
export function dernierOrdre(statuts: { ordre: number }[]): number {
  return statuts.length > 0 ? Math.max(...statuts.map((s) => s.ordre)) : 0;
}

// Une échéance de tournage n'a de sens que tant que le tournage n'a pas eu
// lieu (1ère étape du pipeline, rattachée au responsable tournage) ; une
// échéance de livraison reste valable tant que la vidéo n'est pas à la
// dernière étape (rattachée au responsable montage, qui livre le montage
// final).
export function buildEcheances(videos: VideoForEcheance[], maxOrdre: number): Echeance[] {
  const echeances: Echeance[] = [];
  for (const v of videos) {
    const statut = one(v.statuts);
    const tourneur = one(v.prestataire_tournage);
    const monteur = one(v.prestataire_montage);
    if (statut && statut.ordre >= maxOrdre) continue;

    if (v.date_tournage && statut?.ordre === 0) {
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: tourneur?.id ?? null,
        prestataireNom: tourneur?.nom ?? null,
        type: "tournage",
        date: v.date_tournage,
      });
    }
    if (v.date_livraison) {
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: monteur?.id ?? null,
        prestataireNom: monteur?.nom ?? null,
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
