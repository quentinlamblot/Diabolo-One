export type UserRole = "admin" | "prestataire" | "client";
export type FormatType = "16:9" | "9:16" | "16:9 et 9:16";
export type CharteStatus = "ok" | "en_attente";
export type StatutType = "projet" | "interviewe" | "video";
export type TypeRemuneration = "monteur" | "graphiste" | "chef_de_projet";
export type SousTypeMonteur = "video_premium" | "video_classique" | "sur_mesure";

export type Categorie = "vert" | "orange" | "rouge";

export interface Statut {
  id: string;
  type: StatutType;
  label: string;
  couleur: string;
  categorie: Categorie | null;
  ordre: number;
  statut_interviewe_lie_id: string | null;
  created_at: string;
  statut_interviewe_lie?: Statut;
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
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TarifMonteur {
  id: string;
  cle: string;
  libelle: string;
  prix: number;
  updated_at: string;
}

export type TypeInterview = "longue" | "courte";

export interface Offre {
  id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  type_interview: TypeInterview;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  client_id: string | null;
  prestataire_id: string | null;
  super_admin: boolean;
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
  nombre_commande: number;
  chef_de_projet_id: string | null;
  instructions_individuelles: string | null;
  lien_edito: string | null;
  lien_riverside: string | null;
  created_at: string;
  updated_at: string;
  // relations jointes (optionnelles selon la requête)
  clients?: Client;
  offres?: Offre;
  statuts?: Statut;
  chef_de_projet?: Prestataire;
}

export interface Interviewe {
  id: string;
  projet_id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  statut_id: string | null;
  date_rdv: string | null;
  notes: string | null;
  custom_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
  statuts?: Statut;
}

export interface Video {
  id: string;
  projet_id: string;
  titre: string | null;
  statut_id: string | null;
  interviewe_id: string | null;
  date_tournage: string | null;
  date_livraison: string | null;
  notes: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
  statuts?: Statut;
  interviewes?: Interviewe;
}

export interface ProjetVideoResponsable {
  id: string;
  projet_id: string;
  statut_id: string;
  prestataire_id: string;
  created_at: string;
  prestataires?: Prestataire;
}

export interface IntervieweChamp {
  id: string;
  label: string;
  ordre: number;
  created_at: string;
}

export interface TrameInterview {
  id: string;
  projet_id: string;
  type_interview: TypeInterview;
  questions: string[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingReponse {
  id: string;
  projet_id: string;
  reponses: Record<string, string>;
  submitted_by: string | null;
  created_at: string;
}

export interface Commentaire {
  id: string;
  projet_id: string;
  prestataire_id: string | null;
  auteur_id: string;
  contenu: string;
  created_at: string;
  profiles?: Profile;
  prestataires?: Prestataire;
  projets?: Projet;
}

export interface TachePrestataire {
  id: string;
  prestataire_id: string;
  projet_id: string | null;
  mois: string;
  description: string;
  montant: number;
  date_tache: string;
  type_remuneration: TypeRemuneration | null;
  sous_type: string | null;
  quantite: number | null;
  pourcentage_remuneration: number | null;
  pourcentage_effectue: number | null;
  created_at: string;
  prestataires?: Prestataire;
  projets?: Projet;
}

export type ProdStatut = "a_venir" | "en_cours" | "termine" | "annule";

export interface ProdProjet {
  id: string;
  nom: string;
  client: string | null;
  type_prestation: string | null;
  date_prestation: string | null;
  statut: ProdStatut;
  valeur_deal: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProdProjetPrestataire {
  id: string;
  prod_projet_id: string;
  prestataire_id: string;
  montant_du: number | null;
  date_paiement: string | null;
  created_at: string;
  prestataires?: Prestataire;
}
