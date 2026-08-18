export type QuestionType = "text" | "textarea" | "radio";

export interface Question {
  key: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
}

export interface Section {
  title: string;
  questions: Question[];
}

export const ONBOARDING_SECTIONS: Section[] = [
  {
    title: "Informations sur l'entreprise",
    questions: [
      { key: "company_name", label: "Nom de l'entreprise", type: "text", required: true },
      { key: "website", label: "Site web", type: "text", required: true },
      { key: "contact_principal", label: "Contact principal (nom, rôle, email)", type: "textarea", required: true },
    ],
  },
  {
    title: "Offre / Produit",
    questions: [
      { key: "produit_description", label: "Nom et description du produit ou service", type: "textarea", required: true },
      { key: "probleme_principal", label: "Quel est le problème principal résolu ?", type: "textarea", required: true },
      { key: "valeur_cle", label: "Quelle valeur clé mettre en avant ?", type: "textarea", required: true },
    ],
  },
  {
    title: "Marché & Cible",
    questions: [
      { key: "marche_principal", label: "Marché principal (B2B, SaaS, PME, grand compte, autre...)", type: "textarea", required: true },
      {
        key: "persona_cible",
        label: "Persona cible principal (rôle, type d'entreprise, niveau de responsabilité, enjeux métier)",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    title: "Objectifs & Usage",
    questions: [
      { key: "objectif_principal", label: "Objectif principal (rassurer, crédibiliser, etc.)", type: "textarea", required: true },
      { key: "canaux_diffusion", label: "Canaux de diffusion prévus", type: "textarea", required: true },
      { key: "format_video", label: "Format vidéo souhaité (16:9, 9:16, etc.)", type: "text", required: true },
      { key: "duree_souhaitee", label: "Durée souhaitée", type: "text", required: true },
    ],
  },
  {
    title: "Process de vente",
    questions: [{ key: "process_vente", label: "Process de vente actuel", type: "textarea", required: true }],
  },
  {
    title: "Transformation client",
    questions: [
      { key: "probleme_client_avant", label: "Principal problème du client avant votre solution", type: "textarea", required: true },
      { key: "elements_frustrants", label: "Éléments compliqués ou frustrants pour le client", type: "textarea", required: true },
      { key: "changements_apres", label: "Changements depuis l'utilisation de la solution", type: "textarea", required: true },
      { key: "resultats_concrets", label: "Résultats concrets obtenus", type: "textarea", required: true },
      { key: "differenciateurs", label: "Différenciateurs clés face à la concurrence", type: "textarea", required: true },
    ],
  },
  {
    title: "Objections",
    questions: [
      { key: "objections_courantes", label: "Objections courantes avant achat", type: "textarea", required: true },
      { key: "objection_specifique", label: "Objection spécifique à adresser dans la vidéo", type: "textarea", required: true },
    ],
  },
  {
    title: "Messages clés",
    questions: [
      { key: "sujets_essentiels", label: "Sujets essentiels à aborder", type: "textarea", required: true },
      { key: "sujets_sensibles", label: "Sujets sensibles ou zones à éviter", type: "textarea", required: true },
      { key: "preferences_vocabulaire", label: "Préférences de vocabulaire", type: "textarea", required: true },
    ],
  },
  {
    title: "Identité visuelle",
    questions: [
      { key: "lien_logo", label: "Lien vers le logo", type: "text", required: true },
      { key: "lien_charte", label: "Lien vers la charte graphique", type: "text", required: true },
      { key: "graphismes_motion", label: "Graphismes de marque / motion design disponibles", type: "text", required: true },
      { key: "couleurs_typo", label: "Couleurs & typographies", type: "textarea", required: true },
      { key: "exemples_videos", label: "Exemples de vidéos précédentes", type: "text", required: true },
      { key: "contraintes_additionnelles", label: "Contraintes additionnelles", type: "text", required: false },
    ],
  },
  {
    title: "Format & Participants",
    questions: [
      { key: "nombre_temoignages", label: "Nombre de témoignages souhaités & durée", type: "text", required: true },
      {
        key: "sujets_interview",
        label: "Personnes à interviewer (noms, emails, téléphones)",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    title: "Validation",
    questions: [
      {
        key: "confirmation",
        label: "Ce brief est-il complet ?",
        type: "radio",
        required: true,
        options: ["Oui", "Il manque des éléments", "Autre"],
      },
    ],
  },
];
