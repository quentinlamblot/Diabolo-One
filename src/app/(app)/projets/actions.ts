"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function num(formData: FormData, key: string): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

// Complète le board vidéo jusqu'à `target` fiches en statut "à tourner",
// sans jamais retirer de fiches existantes si la cible diminue.
async function ensureVideoCount(supabase: Awaited<ReturnType<typeof createClient>>, projetId: string, target: number) {
  if (target <= 0) return;

  const { count } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("projet_id", projetId);
  const missing = target - (count ?? 0);
  if (missing <= 0) return;

  const { data: premierStatut } = await supabase.from("statuts").select("id").eq("type", "video").order("ordre").limit(1).single();

  const rows = Array.from({ length: missing }, () => ({
    projet_id: projetId,
    statut_id: premierStatut?.id ?? null,
  }));
  await supabase.from("videos").insert(rows);
}

// Prévient le prestataire assigné à l'habillage qu'il a du travail sur ce
// projet, comme pour une affectation classique — en mettant en avant la
// date limite, l'information la plus utile pour lui.
async function notifierHabillage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projetNom: string | null,
  prestataireId: string,
  habillageDate: string | null
) {
  const { data: prestataire } = await supabase.from("prestataires").select("nom, email").eq("id", prestataireId).single();
  if (!prestataire?.email) return;

  const dateFormatee = habillageDate
    ? new Date(habillageDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  await sendEmail({
    to: prestataire.email,
    subject: `Habillage à faire : ${projetNom ?? "un projet"}`,
    html: `
      <p>Bonjour ${prestataire.nom},</p>
      <p>Vous êtes en charge de l'habillage du projet <strong>${projetNom ?? ""}</strong>.</p>
      ${dateFormatee ? `<p>Date limite : <strong>${dateFormatee}</strong></p>` : ""}
      <p>Connectez-vous à Gestion Projet pour voir le détail.</p>
    `,
  });
}

export async function createProjet(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const nombreCommande = num(formData, "nombre_commande");
  const nom = str(formData, "nom");
  const habillagePrestataireId = str(formData, "habillage_prestataire_id");
  const habillageDate = str(formData, "habillage_date");
  const { data, error } = await supabase
    .from("projets")
    .insert({
      nom,
      client_id: str(formData, "client_id"),
      offre_id: str(formData, "offre_id"),
      format: str(formData, "format") ?? "16:9",
      duree_moyenne: str(formData, "duree_moyenne"),
      infos_complementaires: str(formData, "infos_complementaires"),
      statut_id: str(formData, "statut_id"),
      charte_graphique: str(formData, "charte_graphique") ?? "en_attente",
      nombre_commande: nombreCommande,
      chef_de_projet_id: str(formData, "chef_de_projet_id"),
      instructions_individuelles: str(formData, "instructions_individuelles"),
      lien_edito: str(formData, "lien_edito"),
      lien_riverside: str(formData, "lien_riverside"),
      habillage_fait: bool(formData, "habillage_fait"),
      habillage_lien: str(formData, "habillage_lien"),
      habillage_date: habillageDate,
      habillage_prestataire_id: habillagePrestataireId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (habillagePrestataireId) {
    await notifierHabillage(supabase, nom, habillagePrestataireId, habillageDate);
  }

  await ensureVideoCount(supabase, data.id, nombreCommande);

  revalidatePath("/projets");
  redirect(`/projets/${data.id}`);
}

export async function updateProjet(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");
  const supabase = await createClient();

  const nombreCommande = num(formData, "nombre_commande");
  const nom = str(formData, "nom");
  const habillagePrestataireId = str(formData, "habillage_prestataire_id");
  const habillageDate = str(formData, "habillage_date");
  const payload = {
    nom,
    client_id: str(formData, "client_id"),
    offre_id: str(formData, "offre_id"),
    format: str(formData, "format") ?? "16:9",
    duree_moyenne: str(formData, "duree_moyenne"),
    infos_complementaires: str(formData, "infos_complementaires"),
    statut_id: str(formData, "statut_id"),
    charte_graphique: str(formData, "charte_graphique") ?? "en_attente",
    nombre_commande: nombreCommande,
    chef_de_projet_id: str(formData, "chef_de_projet_id"),
    instructions_individuelles: str(formData, "instructions_individuelles"),
    lien_edito: str(formData, "lien_edito"),
    lien_riverside: str(formData, "lien_riverside"),
    habillage_fait: bool(formData, "habillage_fait"),
    habillage_lien: str(formData, "habillage_lien"),
    habillage_date: habillageDate,
    habillage_prestataire_id: habillagePrestataireId,
  };

  const { data: avant } = await supabase
    .from("projets")
    .select("habillage_prestataire_id, habillage_date")
    .eq("id", projetId)
    .single();

  const { error } = await supabase.from("projets").update(payload).eq("id", projetId);
  if (error) throw new Error(error.message);

  // Prévenir lors d'une nouvelle affectation, d'un changement de
  // prestataire, ou d'un changement de la date limite (même prestataire
  // déjà en poste) — mais pas à chaque sauvegarde automatique du formulaire
  // qui ne touche ni l'un ni l'autre.
  const prestataireChange = habillagePrestataireId !== avant?.habillage_prestataire_id;
  const dateChange = habillageDate !== (avant?.habillage_date ?? null);
  if (habillagePrestataireId && (prestataireChange || dateChange)) {
    await notifierHabillage(supabase, nom, habillagePrestataireId, habillageDate);
  }

  await ensureVideoCount(supabase, projetId, nombreCommande);

  revalidatePath("/projets");
  revalidatePath(`/projets/${projetId}`);
  revalidatePath(`/projets/${projetId}/videos`);
}

export async function deleteProjet(projetId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("projets").delete().eq("id", projetId);
  if (error) throw new Error(error.message);

  revalidatePath("/projets");
  redirect("/projets");
}

export async function assignPrestataire(projetId: string, prestataireId: string, commentaire: string | null) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projet_prestataires")
    .insert({ projet_id: projetId, prestataire_id: prestataireId });
  if (error) throw new Error(error.message);

  const [{ data: projet }, { data: prestataire }] = await Promise.all([
    supabase.from("projets").select("nom").eq("id", projetId).single(),
    supabase.from("prestataires").select("nom, email").eq("id", prestataireId).single(),
  ]);

  const texteCommentaire = commentaire?.trim() || null;

  if (texteCommentaire) {
    const { error: commentError } = await supabase.from("commentaires").insert({
      projet_id: projetId,
      prestataire_id: prestataireId,
      auteur_id: profile.id,
      contenu: texteCommentaire,
    });
    if (commentError) throw new Error(commentError.message);
  }

  if (prestataire?.email) {
    await sendEmail({
      to: prestataire.email,
      subject: `Nouvelle affectation : ${projet?.nom ?? "un projet"}`,
      html: `
        <p>Bonjour ${prestataire.nom},</p>
        <p>Vous avez été affecté(e) au projet <strong>${projet?.nom ?? ""}</strong>.</p>
        ${texteCommentaire ? `<p><strong>Message :</strong><br/>${texteCommentaire.replace(/\n/g, "<br/>")}</p>` : ""}
        <p>Connectez-vous à Gestion Projet pour voir le détail.</p>
      `,
    });
  }

  revalidatePath(`/projets/${projetId}`);
  revalidatePath("/messagerie");
}

export async function unassignPrestataire(projetId: string, prestataireId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projet_prestataires")
    .delete()
    .eq("projet_id", projetId)
    .eq("prestataire_id", prestataireId);
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}`);
}
