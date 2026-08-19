"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

export async function createVideo(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();

  const { data: premierStatut } = await supabase.from("statuts").select("id").eq("type", "video").order("ordre").limit(1).single();

  const { error } = await supabase.from("videos").insert({
    projet_id: projetId,
    titre: str(formData, "titre"),
    statut_id: premierStatut?.id ?? null,
    interviewe_id: str(formData, "interviewe_id"),
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

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
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
