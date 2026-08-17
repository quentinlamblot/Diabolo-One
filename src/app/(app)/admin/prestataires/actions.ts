"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createPrestataireEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const tauxRaw = str(formData, "taux_horaire");
  const { error } = await supabase.from("prestataires").insert({
    nom: str(formData, "nom"),
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    taux_horaire: tauxRaw ? Number(tauxRaw) : null,
    notes: str(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestataires");
}

export async function deletePrestataireEntry(prestataireId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prestataires").delete().eq("id", prestataireId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/prestataires");
}
