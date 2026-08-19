"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { StatutType, Categorie } from "@/types/database";

function categorieOrNull(formData: FormData): Categorie | null {
  const v = String(formData.get("categorie") ?? "");
  return v === "vert" || v === "orange" || v === "rouge" ? v : null;
}

export async function createStatutEntry(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("statuts").insert({
    type: formData.get("type") as StatutType,
    label: String(formData.get("label") ?? "").trim(),
    couleur: String(formData.get("couleur") ?? "#94a3b8"),
    categorie: categorieOrNull(formData),
    ordre: Number(formData.get("ordre") ?? 0),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/statuts");
}

export async function updateStatutEntry(statutId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const rawCible = formData.get("statut_interviewe_lie_id");
  const cible = typeof rawCible === "string" && rawCible.trim().length > 0 ? rawCible : null;
  const { error } = await supabase
    .from("statuts")
    .update({
      label: String(formData.get("label") ?? "").trim(),
      couleur: String(formData.get("couleur") ?? "#94a3b8"),
      categorie: categorieOrNull(formData),
      ordre: Number(formData.get("ordre") ?? 0),
      statut_interviewe_lie_id: cible,
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

// Force une resynchronisation complète des statuts de contact selon la
// correspondance configurée par colonne vidéo, pour rattraper les vidéos
// qui n'ont jamais déclenché la synchro (déplacées avant que la
// correspondance existe) ou dont le contact a un statut devenu incorrect.
// Contrairement à la synchro automatique (qui ne descend jamais un
// contact), cet outil applique la correspondance actuelle sans condition :
// c'est une correction volontaire des données existantes.
export async function resynchroniserContactsVideo() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: videoStatuts } = await supabase
    .from("statuts")
    .select("id, statut_interviewe_lie_id")
    .eq("type", "video")
    .not("statut_interviewe_lie_id", "is", null);
  const cibleParStatut = new Map((videoStatuts ?? []).map((s) => [s.id, s.statut_interviewe_lie_id as string]));
  if (cibleParStatut.size === 0) return { corriges: 0 };

  const { data: videos } = await supabase.from("videos").select("interviewe_id, statut_id").not("interviewe_id", "is", null);

  let corriges = 0;
  for (const v of videos ?? []) {
    const cibleId = v.statut_id ? cibleParStatut.get(v.statut_id) : undefined;
    if (!cibleId || !v.interviewe_id) continue;
    const { error } = await supabase.from("interviewes").update({ statut_id: cibleId }).eq("id", v.interviewe_id);
    if (!error) corriges += 1;
  }

  revalidatePath("/admin/statuts");
  return { corriges };
}
