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

// Les statuts vidéo sont personnalisables (libellé) par l'admin : on repère
// "pas encore tourné" / "tourné et au-delà" par la position dans le
// pipeline (ordre >= 1) plutôt que par un texte qui peut être renommé
// (ex. "Tourné" → "Booké").

// Une fois la vidéo tournée (elle a quitté la 1ère étape du pipeline), le
// contact lié n'a plus à être suivi côté prospection : son statut passe
// automatiquement sur "Tourné" (jamais l'inverse, jamais de retour en
// arrière automatique).
async function syncContactApresTournage(supabase: SupabaseServerClient, videoId: string) {
  const { data: video } = await supabase.from("videos").select("interviewe_id, statuts(ordre)").eq("id", videoId).single();
  if (!video?.interviewe_id) return;
  const statut = Array.isArray(video.statuts) ? video.statuts[0] : video.statuts;
  if (!statut || statut.ordre < 1) return;

  const { data: statutTourne } = await supabase
    .from("statuts")
    .select("id")
    .eq("type", "interviewe")
    .eq("label", "Tourné")
    .maybeSingle();
  if (!statutTourne) return;

  await supabase.from("interviewes").update({ statut_id: statutTourne.id }).eq("id", video.interviewe_id);
}

// Si la vidéo a quitté la 1ère étape (tournage) sans monteur assigné, on
// applique le responsable montage par défaut du projet (s'il existe), pour
// éviter de le ressaisir à chaque vidéo.
async function appliquerPrestataireDefautSiBesoin(supabase: SupabaseServerClient, videoId: string) {
  const { data: video } = await supabase
    .from("videos")
    .select("projet_id, prestataire_montage_id, statuts(ordre)")
    .eq("id", videoId)
    .single();
  if (!video || video.prestataire_montage_id) return;
  const statut = Array.isArray(video.statuts) ? video.statuts[0] : video.statuts;
  if (!statut || statut.ordre < 1) return;

  const { data: projet } = await supabase
    .from("projets")
    .select("prestataire_montage_defaut_id")
    .eq("id", video.projet_id)
    .single();
  if (!projet?.prestataire_montage_defaut_id) return;

  await supabase.from("videos").update({ prestataire_montage_id: projet.prestataire_montage_defaut_id }).eq("id", videoId);
}

export async function createVideo(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();

  const [{ data: premierStatut }, { data: projet }] = await Promise.all([
    supabase.from("statuts").select("id").eq("type", "video").order("ordre").limit(1).single(),
    supabase.from("projets").select("prestataire_tournage_defaut_id, prestataire_montage_defaut_id").eq("id", projetId).single(),
  ]);

  const { error } = await supabase.from("videos").insert({
    projet_id: projetId,
    titre: str(formData, "titre"),
    statut_id: premierStatut?.id ?? null,
    prestataire_tournage_id: str(formData, "prestataire_tournage_id") ?? projet?.prestataire_tournage_defaut_id ?? null,
    prestataire_montage_id: str(formData, "prestataire_montage_id") ?? projet?.prestataire_montage_defaut_id ?? null,
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
      prestataire_tournage_id: str(formData, "prestataire_tournage_id"),
      prestataire_montage_id: str(formData, "prestataire_montage_id"),
      interviewe_id: str(formData, "interviewe_id"),
      date_tournage: str(formData, "date_tournage"),
      date_livraison: str(formData, "date_livraison"),
      notes: str(formData, "notes"),
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  await syncContactApresTournage(supabase, videoId);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

export async function updateVideoStatut(projetId: string, videoId: string, statutId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "prestataire") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("videos").update({ statut_id: statutId }).eq("id", videoId);
  if (error) throw new Error(error.message);

  await Promise.all([syncContactApresTournage(supabase, videoId), appliquerPrestataireDefautSiBesoin(supabase, videoId)]);

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
