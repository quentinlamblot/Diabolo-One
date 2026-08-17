"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTache(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const mois = String(formData.get("mois") ?? ""); // format YYYY-MM
  const dateTache = String(formData.get("date_tache") ?? "");
  const projetId = String(formData.get("projet_id") ?? "").trim();

  const { error } = await supabase.from("taches_prestataires").insert({
    prestataire_id: String(formData.get("prestataire_id")),
    projet_id: projetId.length ? projetId : null,
    mois: `${mois}-01`,
    description: String(formData.get("description") ?? "").trim(),
    montant: Number(formData.get("montant") ?? 0),
    date_tache: dateTache.length ? dateTache : new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/paiements");
}

export async function deleteTache(tacheId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("taches_prestataires").delete().eq("id", tacheId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/paiements");
}
