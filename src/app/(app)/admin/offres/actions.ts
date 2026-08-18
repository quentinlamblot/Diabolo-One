"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createOffreEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const prixRaw = str(formData, "prix");
  const { error } = await supabase.from("offres").insert({
    nom: str(formData, "nom"),
    description: str(formData, "description"),
    prix: prixRaw ? Number(prixRaw) : null,
    type_interview: str(formData, "type_interview") ?? "courte",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/offres");
}

export async function updateOffreEntry(offreId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const prixRaw = str(formData, "prix");
  const { error } = await supabase
    .from("offres")
    .update({
      nom: str(formData, "nom"),
      description: str(formData, "description"),
      prix: prixRaw ? Number(prixRaw) : null,
      type_interview: str(formData, "type_interview") ?? "courte",
    })
    .eq("id", offreId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/offres");
}

export async function deleteOffreEntry(offreId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("offres").delete().eq("id", offreId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/offres");
}
