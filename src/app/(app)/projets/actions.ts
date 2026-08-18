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

  const { data: premierStatut } = await supabase
    .from("statuts")
    .select("id")
    .eq("type", "video")
    .order("ordre")
    .limit(1)
    .single();

  const rows = Array.from({ length: missing }, () => ({ projet_id: projetId, statut_id: premierStatut?.id ?? null }));
  await supabase.from("videos").insert(rows);
}

export async function createProjet(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const nombreCommande = num(formData, "nombre_commande");
  const { data, error } = await supabase
    .from("projets")
    .insert({
      nom: str(formData, "nom"),
      client_id: str(formData, "client_id"),
      offre_id: str(formData, "offre_id"),
      format: str(formData, "format") ?? "16:9",
      duree_moyenne: str(formData, "duree_moyenne"),
      infos_complementaires: str(formData, "infos_complementaires"),
      statut_id: str(formData, "statut_id"),
      charte_graphique: str(formData, "charte_graphique") ?? "en_attente",
      nombre_commande: nombreCommande,
      instructions_individuelles: str(formData, "instructions_individuelles"),
      lien_edito: str(formData, "lien_edito"),
      lien_riverside: str(formData, "lien_riverside"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await ensureVideoCount(supabase, data.id, nombreCommande);

  revalidatePath("/projets");
  redirect(`/projets/${data.id}`);
}

export async function updateProjet(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");
  const supabase = await createClient();

  const nombreCommande = num(formData, "nombre_commande");
  const payload = {
    nom: str(formData, "nom"),
    client_id: str(formData, "client_id"),
    offre_id: str(formData, "offre_id"),
    format: str(formData, "format") ?? "16:9",
    duree_moyenne: str(formData, "duree_moyenne"),
    infos_complementaires: str(formData, "infos_complementaires"),
    statut_id: str(formData, "statut_id"),
    charte_graphique: str(formData, "charte_graphique") ?? "en_attente",
    nombre_commande: nombreCommande,
    instructions_individuelles: str(formData, "instructions_individuelles"),
    lien_edito: str(formData, "lien_edito"),
    lien_riverside: str(formData, "lien_riverside"),
  };

  const { error } = await supabase.from("projets").update(payload).eq("id", projetId);
  if (error) throw new Error(error.message);

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
