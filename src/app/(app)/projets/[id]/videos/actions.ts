"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createVideo(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();

  const { data: premierStatut } = await supabase
    .from("statuts")
    .select("id")
    .eq("type", "video")
    .order("ordre")
    .limit(1)
    .single();

  const { error } = await supabase.from("videos").insert({
    projet_id: projetId,
    titre: str(formData, "titre"),
    statut_id: premierStatut?.id ?? null,
    prestataire_id: str(formData, "prestataire_id"),
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
      prestataire_id: str(formData, "prestataire_id"),
      interviewe_id: str(formData, "interviewe_id"),
      date_tournage: str(formData, "date_tournage"),
      date_livraison: str(formData, "date_livraison"),
      notes: str(formData, "notes"),
    })
    .eq("id", videoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}/videos`);
  revalidatePath(`/projets/${projetId}`);
}

export async function updateVideoStatut(projetId: string, videoId: string, statutId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "prestataire") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("videos").update({ statut_id: statutId }).eq("id", videoId);
  if (error) throw new Error(error.message);

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
