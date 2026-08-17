"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createInterviewe(projetId: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("interviewes").insert({
    projet_id: projetId,
    nom: str(formData, "nom"),
    prenom: str(formData, "prenom"),
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    statut_id: str(formData, "statut_id"),
    notes: str(formData, "notes"),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}

export async function updateIntervieweStatut(projetId: string, intervieweId: string, statutId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviewes")
    .update({ statut_id: statutId })
    .eq("id", intervieweId);

  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}

export async function deleteInterviewe(projetId: string, intervieweId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("interviewes").delete().eq("id", intervieweId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}
