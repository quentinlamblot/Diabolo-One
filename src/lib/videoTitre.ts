// Titre par défaut d'une vidéo liée à un contact : son nom + un identifiant
// court, pour distinguer plusieurs vidéos sans titre saisi manuellement.
export function defaultVideoTitre(prenom: string | null, nom: string | null, id: string): string {
  const nomComplet = [prenom, nom].filter(Boolean).join(" ").trim();
  const courtId = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return nomComplet ? `${nomComplet} #${courtId}` : `Vidéo #${courtId}`;
}
