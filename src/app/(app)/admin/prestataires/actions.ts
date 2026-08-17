"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createPrestataireEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prestataires").insert({
    nom: str(formData, "nom"),
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    notes: str(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestataires");
}

export async function updatePrestataireEntry(prestataireId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("prestataires")
    .update({
      nom: str(formData, "nom"),
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      notes: str(formData, "notes"),
    })
    .eq("id", prestataireId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestataires");
  redirect("/admin/prestataires");
}

export async function deletePrestataireEntry(prestataireId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prestataires").delete().eq("id", prestataireId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestataires");
}
