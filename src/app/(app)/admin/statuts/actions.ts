"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { StatutType } from "@/types/database";

export async function createStatutEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("statuts").insert({
    type: formData.get("type") as StatutType,
    label: String(formData.get("label") ?? "").trim(),
    couleur: String(formData.get("couleur") ?? "#94a3b8"),
    ordre: Number(formData.get("ordre") ?? 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/statuts");
}

export async function updateStatutEntry(statutId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("statuts")
    .update({
      label: String(formData.get("label") ?? "").trim(),
      couleur: String(formData.get("couleur") ?? "#94a3b8"),
      ordre: Number(formData.get("ordre") ?? 0),
    })
    .eq("id", statutId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/statuts");
}

export async function deleteStatutEntry(statutId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("statuts").delete().eq("id", statutId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/statuts");
}
