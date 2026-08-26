"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { defaultVideoTitre } from "@/lib/videoTitre";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

// Le statut d'un contact lié peut être piloté par l'étape du pipeline
// vidéo, configurable par statut vidéo (Gestion > Statuts) plutôt que
// codé en dur : la colonne peut vouloir dire "RDV pris" ou "déjà filmé"
// selon l'équipe, donc c'est l'admin qui choisit la correspondance.
// Jamais de retour en arrière automatique : on ne descend jamais le
// contact d'une étape à une étape antérieure.
async function syncContactSelonStatut(supabase: SupabaseServerClient, videoId: string) {
  const { data: video } = await supabase
    .from("videos")
    .select("interviewe_id, statuts(statut_interviewe_lie_id)")
    .eq("id", videoId)
    .single();
  if (!video?.interviewe_id) return;
  const statut = Array.isArray(video.statuts) ? video.statuts[0] : video.statuts;
  const cibleId = statut?.statut_interviewe_lie_id;
  if (!cibleId) return;

  const [{ data: cible }, { data: contact }] = await Promise.all([
    supabase.from("statuts").select("ordre").eq("id", cibleId).single(),
    supabase.from("interviewes").select("statut_id, statuts(ordre)").eq("id", video.interviewe_id).single(),
  ]);
  if (!cible) return;
  const actuel = contact ? (Array.isArray(contact.statuts) ? contact.statuts[0] : contact.statuts) : null;
  if (actuel && actuel.ordre >= cible.ordre) return;

  await supabase.from("interviewes").update({ statut_id: cibleId }).eq("id", video.interviewe_id);
}

// Le chef de projet touche automatiquement 20% du prix de l'offre, réparti
// à parts égales entre les vidéos commandées : chaque vidéo qui atteint la
// dernière étape du pipeline ("Livré") déclenche le versement de sa part.
// Rattaché à video_id pour rester idempotent si le statut repasse par
// "Livré" (aucune ligne en double créée).
async function syncPaiementChefDeProjet(supabase: SupabaseServerClient, videoId: string) {
  const { data: video } = await supabase
    .from("videos")
    .select("projet_id, titre, statuts(ordre)")
    .eq("id", videoId)
    .single();
  if (!video) return;
  const statut = Array.isArray(video.statuts) ? video.statuts[0] : video.statuts;
  if (!statut) return;

  const { data: statutsVideo } = await supabase.from("statuts").select("ordre").eq("type", "video");
  const maxOrdre = statutsVideo && statutsVideo.length > 0 ? Math.max(...statutsVideo.map((s) => s.ordre)) : 0;
  if (statut.ordre < maxOrdre) return;

  const { data: dejaVerse } = await supabase
    .from("taches_prestataires")
    .select("id")
    .eq("video_id", videoId)
    .eq("type_remuneration", "chef_de_projet")
    .maybeSingle();
  if (dejaVerse) return;

  const { data: projet } = await supabase
    .from("projets")
    .select("chef_de_projet_id, nombre_commande, offres(prix)")
    .eq("id", video.projet_id)
    .single();
  if (!projet?.chef_de_projet_id) return;

  const offre = Array.isArray(projet.offres) ? projet.offres[0] : projet.offres;
  const prixOffre = Number(offre?.prix ?? 0);
  const nombreCommande = projet.nombre_commande > 0 ? projet.nombre_commande : 1;
  const pourcentageEffectue = 100 / nombreCommande;
  const montant = prixOffre * 0.2 * (pourcentageEffectue / 100);

  await supabase.from("taches_prestataires").insert({
    prestataire_id: projet.chef_de_projet_id,
    projet_id: video.projet_id,
    video_id: videoId,
    mois: `${new Date().toISOString().slice(0, 7)}-01`,
    description: `Chef de projet — ${video.titre ?? "vidéo"} livrée (20% × ${pourcentageEffectue.toFixed(1)}% du projet)`,
    montant,
    date_tache: new Date().toISOString().slice(0, 10),
    type_remuneration: "chef_de_projet",
    pourcentage_remuneration: 20,
    pourcentage_effectue: pourcentageEffectue,
  });
}

// Le monteur touche automatiquement le tarif (classique/premium) défini sur
// l'offre du projet, dès qu'une vidéo atteint la dernière étape du pipeline
// ("Livré"). Le monteur est le responsable de la colonne taguée "étape de
// montage" (Gestion > Statuts) pour ce projet — même mécanisme que les
// responsables par colonne utilisés pour les échéances. Rattaché à video_id
// pour rester idempotent.
async function syncPaiementMonteur(supabase: SupabaseServerClient, videoId: string) {
  const { data: video } = await supabase
    .from("videos")
    .select("projet_id, titre, statuts(ordre)")
    .eq("id", videoId)
    .single();
  if (!video) return;
  const statutVideo = Array.isArray(video.statuts) ? video.statuts[0] : video.statuts;
  if (!statutVideo) return;

  const { data: statutsVideoAll } = await supabase.from("statuts").select("id, ordre, est_etape_montage").eq("type", "video");
  const maxOrdre = statutsVideoAll && statutsVideoAll.length > 0 ? Math.max(...statutsVideoAll.map((s) => s.ordre)) : 0;
  if (statutVideo.ordre < maxOrdre) return;

  const colonneMontage = (statutsVideoAll ?? []).find((s) => s.est_etape_montage);
  if (!colonneMontage) return;

  const { data: dejaVerse } = await supabase
    .from("taches_prestataires")
    .select("id")
    .eq("video_id", videoId)
    .eq("type_remuneration", "monteur")
    .maybeSingle();
  if (dejaVerse) return;

  const [{ data: responsableProjet }, { data: colonneInfo }, { data: projet }] = await Promise.all([
    supabase
      .from("projet_video_responsables")
      .select("prestataire_id")
      .eq("projet_id", video.projet_id)
      .eq("statut_id", colonneMontage.id)
      .maybeSingle(),
    supabase.from("statuts").select("responsable_defaut_id").eq("id", colonneMontage.id).single(),
    supabase.from("projets").select("offres(sous_type_monteur)").eq("id", video.projet_id).single(),
  ]);
  const monteurId = responsableProjet?.prestataire_id ?? colonneInfo?.responsable_defaut_id ?? null;
  if (!monteurId) return;

  const offre = projet ? (Array.isArray(projet.offres) ? projet.offres[0] : projet.offres) : null;
  const sousType = offre?.sous_type_monteur;
  if (sousType !== "video_premium" && sousType !== "video_classique") return;

  const { data: tarif } = await supabase.from("tarifs_monteur").select("libelle, prix").eq("cle", sousType).single();
  if (!tarif) return;

  await supabase.from("taches_prestataires").insert({
    prestataire_id: monteurId,
    projet_id: video.projet_id,
    video_id: videoId,
    mois: `${new Date().toISOString().slice(0, 7)}-01`,
    description: `${tarif.libelle} — ${video.titre ?? "vidéo"}`,
    montant: Number(tarif.prix),
    date_tache: new Date().toISOString().slice(0, 10),
    type_remuneration: "monteur",
    sous_type: sousType,
    quantite: 1,
  });
}

export async function createVideo(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();

  const intervieweId = str(formData, "interviewe_id");
  const [{ data: premierStatut }, { data: contact }] = await Promise.all([
    supabase.from("statuts").select("id").eq("type", "video").order("ordre").limit(1).single(),
    intervieweId ? supabase.from("interviewes").select("prenom, nom").eq("id", intervieweId).single() : Promise.resolve({ data: null }),
  ]);

  const newId = randomUUID();
  const titreSaisi = str(formData, "titre");
  const titre = titreSaisi ?? (contact ? defaultVideoTitre(contact.prenom, contact.nom, newId) : null);

  const { error } = await supabase.from("videos").insert({
    id: newId,
    projet_id: projetId,
    titre,
    statut_id: premierStatut?.id ?? null,
    interviewe_id: intervieweId,
    date_tournage: str(formData, "date_tournage"),
    date_livraison: str(formData, "date_livraison"),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

export async function updateVideo(projetId: string, videoId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({
      titre: str(formData, "titre"),
      statut_id: str(formData, "statut_id"),
      interviewe_id: str(formData, "interviewe_id"),
      date_tournage: str(formData, "date_tournage"),
      date_livraison: str(formData, "date_livraison"),
      notes: str(formData, "notes"),
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  await syncContactSelonStatut(supabase, videoId);
  await syncPaiementChefDeProjet(supabase, videoId);
  await syncPaiementMonteur(supabase, videoId);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

export async function updateVideoStatut(projetId: string, videoId: string, statutId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "prestataire") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("videos").update({ statut_id: statutId }).eq("id", videoId);
  if (error) throw new Error(error.message);

  await syncContactSelonStatut(supabase, videoId);
  await syncPaiementChefDeProjet(supabase, videoId);
  await syncPaiementMonteur(supabase, videoId);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
  revalidatePath("/admin/paiements");
}

export async function deleteVideo(projetId: string, videoId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

// Le prestataire assigné à l'habillage peut cocher "fait" et renseigner le
// lien des fichiers sources lui-même, depuis la page vidéos qu'il consulte
// déjà — la date et l'affectation restent décidées par l'admin sur la fiche
// projet. Accès restreint à l'admin OU au prestataire précisément assigné
// (pas "n'importe quel prestataire", contrairement au statut vidéo).
export async function updateHabillage(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projet } = await supabase.from("projets").select("habillage_prestataire_id").eq("id", projetId).single();
  const estLePrestataireAssigne = profile.role === "prestataire" && profile.prestataire_id === projet?.habillage_prestataire_id;
  if (profile.role !== "admin" && !estLePrestataireAssigne) throw new Error("Non autorisé");

  const { error } = await supabase
    .from("projets")
    .update({
      habillage_fait: formData.get("habillage_fait") === "on",
      habillage_lien: str(formData, "habillage_lien"),
    })
    .eq("id", projetId);
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

// Responsable par colonne du pipeline vidéo (Bruno sur "À tourner",
// Hippolyte sur "En montage", ...), défini une fois par projet pour ne
// plus avoir à choisir un responsable vidéo par vidéo.
export async function setResponsableColonne(projetId: string, statutId: string, prestataireId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  if (!prestataireId) {
    const { error } = await supabase
      .from("projet_video_responsables")
      .delete()
      .eq("projet_id", projetId)
      .eq("statut_id", statutId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("projet_video_responsables")
      .upsert({ projet_id: projetId, statut_id: statutId, prestataire_id: prestataireId }, { onConflict: "projet_id,statut_id" });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projets/${projetId}/videos`);
}
