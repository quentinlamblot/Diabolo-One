export type UserRole = "admin" | "prestataire" | "client";
export type FormatType = "16:9" | "9:16" | "16:9 et 9:16";
export type CharteStatus = "ok" | "en_attente";
export type StatutType = "projet" | "interviewe";

export interface Statut {
  id: string;
  type: StatutType;
  label: string;
  couleur: string;
  ordre: number;
  created_at: string;
}

export interface Client {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prestataire {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  taux_horaire: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offre {
  id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
  prestataire_id: string | null;
  created_at: string;
}

export interface Projet {
  id: string;
  nom: string;
  client_id: string;
  offre_id: string | null;
  format: FormatType;
  duree_moyenne: string | null;
  infos_complementaires: string | null;
  statut_id: string | null;
  charte_graphique: CharteStatus;
  nombre_prevu: number;
  nombre_booke: number;
  nombre_tourne: number;
  nombre_a_monter: number;
  nombre_termine: number;
  instructions_individuelles: string | null;
  lien_edito: string | null;
  lien_riverside: string | null;
  created_at: string;
  updated_at: string;
  // relations jointes (optionnelles selon la requête)
  clients?: Client;
  offres?: Offre;
  statuts?: Statut;
}

export interface Interviewe {
  id: string;
  projet_id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  statut_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  statuts?: Statut;
}

export interface TachePrestataire {
  id: string;
  prestataire_id: string;
  projet_id: string | null;
  mois: string;
  description: string;
  montant: number;
  date_tache: string;
  created_at: string;
  prestataires?: Prestataire;
  projets?: Projet;
}
