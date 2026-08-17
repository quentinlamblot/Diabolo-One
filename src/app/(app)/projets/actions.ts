"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function num(formData: FormData, key: string): number {
  const v = formData.get(key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function createProjet(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
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
      nombre_prevu: num(formData, "nombre_prevu"),
      nombre_booke: num(formData, "nombre_booke"),
      nombre_tourne: num(formData, "nombre_tourne"),
      nombre_a_monter: num(formData, "nombre_a_monter"),
      nombre_termine: num(formData, "nombre_termine"),
      instructions_individuelles: str(formData, "instructions_individuelles"),
      lien_edito: str(formData, "lien_edito"),
      lien_riverside: str(formData, "lien_riverside"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/projets");
  redirect(`/projets/${data.id}`);
}

export async function updateProjet(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const payload: Record<string, unknown> =
    profile.role === "admin"
      ? {
          nom: str(formData, "nom"),
          client_id: str(formData, "client_id"),
          offre_id: str(formData, "offre_id"),
          format: str(formData, "format") ?? "16:9",
          duree_moyenne: str(formData, "duree_moyenne"),
          infos_complementaires: str(formData, "infos_complementaires"),
          statut_id: str(formData, "statut_id"),
          charte_graphique: str(formData, "charte_graphique") ?? "en_attente",
          nombre_prevu: num(formData, "nombre_prevu"),
          nombre_booke: num(formData, "nombre_booke"),
          nombre_tourne: num(formData, "nombre_tourne"),
          nombre_a_monter: num(formData, "nombre_a_monter"),
          nombre_termine: num(formData, "nombre_termine"),
          instructions_individuelles: str(formData, "instructions_individuelles"),
          lien_edito: str(formData, "lien_edito"),
          lien_riverside: str(formData, "lien_riverside"),
        }
      : profile.role === "prestataire"
        ? {
            nombre_booke: num(formData, "nombre_booke"),
            nombre_tourne: num(formData, "nombre_tourne"),
            nombre_a_monter: num(formData, "nombre_a_monter"),
            nombre_termine: num(formData, "nombre_termine"),
          }
        : (() => {
            throw new Error("Non autorisé");
          })();

  const { error } = await supabase.from("projets").update(payload).eq("id", projetId);
  if (error) throw new Error(error.message);

  revalidatePath("/projets");
  revalidatePath(`/projets/${projetId}`);
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

export async function assignPrestataire(projetId: string, prestataireId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projet_prestataires")
    .insert({ projet_id: projetId, prestataire_id: prestataireId });
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}`);
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
