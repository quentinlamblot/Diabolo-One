export type QuestionType = "text" | "textarea" | "radio";

export interface Question {
  key: string;
  label: string;
  type: QuestionType;
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
      { key: "company_name", label: "Nom de l'entreprise", type: "text" },
      { key: "website", label: "Site web", type: "text" },
      { key: "contact_principal", label: "Contact principal (nom, rôle, email)", type: "textarea" },
    ],
  },
  {
    title: "Offre / Produit",
    questions: [
      { key: "produit_description", label: "Nom et description du produit ou service", type: "textarea" },
      { key: "probleme_principal", label: "Quel est le problème principal résolu ?", type: "textarea" },
      { key: "valeur_cle", label: "Quelle valeur clé mettre en avant ?", type: "textarea" },
    ],
  },
  {
    title: "Marché & Cible",
    questions: [
      { key: "marche_principal", label: "Marché principal (B2B, SaaS, PME, grand compte, autre...)", type: "textarea" },
      {
        key: "persona_cible",
        label: "Persona cible principal (rôle, type d'entreprise, niveau de responsabilité, enjeux métier)",
        type: "textarea",
      },
    ],
  },
  {
    title: "Objectifs & Usage",
    questions: [
      { key: "objectif_principal", label: "Objectif principal (rassurer, crédibiliser, etc.)", type: "textarea" },
      { key: "canaux_diffusion", label: "Canaux de diffusion prévus", type: "textarea" },
      { key: "format_video", label: "Format vidéo souhaité (16:9, 9:16, etc.)", type: "text" },
      { key: "duree_souhaitee", label: "Durée souhaitée", type: "text" },
    ],
  },
  {
    title: "Process de vente",
    questions: [{ key: "process_vente", label: "Process de vente actuel", type: "textarea" }],
  },
  {
    title: "Transformation client",
    questions: [
      { key: "probleme_client_avant", label: "Principal problème du client avant votre solution", type: "textarea" },
      { key: "elements_frustrants", label: "Éléments compliqués ou frustrants pour le client", type: "textarea" },
      { key: "changements_apres", label: "Changements depuis l'utilisation de la solution", type: "textarea" },
      { key: "resultats_concrets", label: "Résultats concrets obtenus", type: "textarea" },
      { key: "differenciateurs", label: "Différenciateurs clés face à la concurrence", type: "textarea" },
    ],
  },
  {
    title: "Objections",
    questions: [
      { key: "objections_courantes", label: "Objections courantes avant achat", type: "textarea" },
      { key: "objection_specifique", label: "Objection spécifique à adresser dans la vidéo", type: "textarea" },
    ],
  },
  {
    title: "Messages clés",
    questions: [
      { key: "sujets_essentiels", label: "Sujets essentiels à aborder", type: "textarea" },
      { key: "sujets_sensibles", label: "Sujets sensibles ou zones à éviter", type: "textarea" },
      { key: "preferences_vocabulaire", label: "Préférences de vocabulaire", type: "textarea" },
    ],
  },
  {
    title: "Identité visuelle",
    questions: [
      { key: "lien_logo", label: "Lien vers le logo", type: "text" },
      { key: "lien_charte", label: "Lien vers la charte graphique", type: "text" },
      { key: "graphismes_motion", label: "Graphismes de marque / motion design disponibles", type: "text" },
      { key: "couleurs_typo", label: "Couleurs & typographies", type: "textarea" },
      { key: "exemples_videos", label: "Exemples de vidéos précédentes", type: "text" },
      { key: "contraintes_additionnelles", label: "Contraintes additionnelles", type: "text" },
    ],
  },
  {
    title: "Format & Participants",
    questions: [
      { key: "nombre_temoignages", label: "Nombre de témoignages souhaités & durée", type: "text" },
      {
        key: "sujets_interview",
        label: "Personnes à interviewer (noms, emails, téléphones)",
        type: "textarea",
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
        options: ["Oui", "Il manque des éléments", "Autre"],
      },
    ],
  },
];
