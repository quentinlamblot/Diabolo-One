"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { genererTrameInterview } from "@/lib/ai";

export async function genererTrame(projetId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: projet }, { data: onboarding }] = await Promise.all([
    supabase.from("projets").select("id, offres(type_interview)").eq("id", projetId).single(),
    supabase.from("onboarding_reponses").select("reponses").eq("projet_id", projetId).maybeSingle(),
  ]);
  if (!projet) throw new Error("Projet introuvable");

  const offre = Array.isArray(projet.offres) ? projet.offres[0] : projet.offres;
  const typeInterview = offre?.type_interview ?? "courte";
  const brief = (onboarding?.reponses ?? {}) as Record<string, string>;

  const questions = await genererTrameInterview({ brief, typeInterview });

  const { error } = await supabase
    .from("trames_interview")
    .upsert({ projet_id: projetId, type_interview: typeInterview, questions }, { onConflict: "projet_id" });
  if (error) throw new Error(error.message);

  revalidatePath(`/projets/${projetId}`);
}

export async function updateTrame(projetId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const questionsText = String(formData.get("questions") ?? "");
  const questions = questionsText
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean);

  const { error } = await supabase.from("trames_interview").update({ questions }).eq("projet_id", projetId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}`);
}
