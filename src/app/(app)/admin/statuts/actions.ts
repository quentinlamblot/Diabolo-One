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

function optionalId(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim().length > 0 ? raw : null;
}

export async function updateStatutEntry(statutId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("statuts")
    .update({
      label: String(formData.get("label") ?? "").trim(),
      couleur: String(formData.get("couleur") ?? "#94a3b8"),
      categorie: categorieOrNull(formData),
      ordre: Number(formData.get("ordre") ?? 0),
      statut_interviewe_lie_id: optionalId(formData, "statut_interviewe_lie_id"),
      statut_video_lie_id: optionalId(formData, "statut_video_lie_id"),
      responsable_defaut_id: optionalId(formData, "responsable_defaut_id"),
      est_etape_montage: formData.get("est_etape_montage") === "on",
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

// Échange la position (ordre) de deux statuts pour réordonner les colonnes
// d'un pipeline sans avoir à ressaisir les numéros d'ordre à la main.
export async function swapStatutOrdre(statutIdA: string, statutIdB: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("statuts").select("id, ordre").in("id", [statutIdA, statutIdB]);
  if (!rows || rows.length !== 2) return;
  const [a, b] = rows;
  await Promise.all([
    supabase.from("statuts").update({ ordre: b.ordre }).eq("id", a.id),
    supabase.from("statuts").update({ ordre: a.ordre }).eq("id", b.id),
  ]);
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
