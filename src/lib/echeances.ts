export interface VideoForEcheance {
  id: string;
  projet_id: string;
  titre: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  statuts: { label: string; couleur: string } | { label: string; couleur: string }[] | null;
  prestataires: { id: string; nom: string } | { id: string; nom: string }[] | null;
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

// Une échéance de tournage n'a de sens que tant que le tournage n'a pas eu lieu ;
// une échéance de livraison reste valable tant que la vidéo n'est pas livrée.
export function buildEcheances(videos: VideoForEcheance[]): Echeance[] {
  const echeances: Echeance[] = [];
  for (const v of videos) {
    const statut = one(v.statuts);
    const presta = one(v.prestataires);
    if (statut?.label === "Livré") continue;

    if (v.date_tournage && statut?.label === "À tourner") {
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: presta?.id ?? null,
        prestataireNom: presta?.nom ?? null,
        type: "tournage",
        date: v.date_tournage,
      });
    }
    if (v.date_livraison) {
      echeances.push({
        videoId: v.id,
        projetId: v.projet_id,
        titre: v.titre,
        prestataireId: presta?.id ?? null,
        prestataireNom: presta?.nom ?? null,
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
