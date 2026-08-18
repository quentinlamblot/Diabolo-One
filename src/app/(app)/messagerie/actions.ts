"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCommentaire(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "prestataire") throw new Error("Non autorisé");

  const projetId = String(formData.get("projet_id") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  if (!projetId || !contenu) throw new Error("Message vide.");

  const supabase = await createClient();

  // Un prestataire commente toujours dans le cadre de sa propre affectation.
  const prestataireId =
    profile.role === "prestataire" ? profile.prestataire_id : String(formData.get("prestataire_id") ?? "").trim() || null;

  const { error } = await supabase.from("commentaires").insert({
    projet_id: projetId,
    prestataire_id: prestataireId,
    auteur_id: profile.id,
    contenu,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/messagerie");
}
