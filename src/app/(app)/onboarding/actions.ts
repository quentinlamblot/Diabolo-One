"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { ONBOARDING_SECTIONS } from "./questions";

const FORMATS_VALIDES = ["16:9", "9:16", "16:9 et 9:16"];

export async function submitOnboarding(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "client" && profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();

  const { data: projet } = await supabase.from("projets").select("id, client_id").eq("id", projetId).single();
  if (!projet) throw new Error("Projet introuvable");
  if (profile.role === "client" && projet.client_id !== profile.client_id) throw new Error("Non autorisé");

  const reponses: Record<string, string> = {};
  for (const section of ONBOARDING_SECTIONS) {
    for (const q of section.questions) {
      const v = formData.get(q.key);
      reponses[q.key] = typeof v === "string" ? v.trim() : "";
    }
  }

  const { error } = await supabase.from("onboarding_reponses").insert({
    projet_id: projetId,
    reponses,
    submitted_by: profile.id,
  });
  if (error) throw new Error(error.message);

  const formatVideo = reponses.format_video?.trim();
  const projetUpdate: Record<string, string> = {};
  if (formatVideo && FORMATS_VALIDES.includes(formatVideo)) {
    projetUpdate.format = formatVideo;
  }
  if (reponses.duree_souhaitee) {
    projetUpdate.duree_moyenne = reponses.duree_souhaitee;
  }
  if (Object.keys(projetUpdate).length > 0) {
    // Le client n'a pas de policy RLS d'update sur projets (seul l'admin édite la
    // fiche) : on utilise le client admin pour ce pré-remplissage automatique et
    // circonscrit, la propriété du projet ayant déjà été vérifiée ci-dessus.
    const admin = createAdminClient();
    await admin.from("projets").update(projetUpdate).eq("id", projetId);
  }
}
