"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { TypeRemuneration } from "@/types/database";

export async function createTache(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const mois = String(formData.get("mois") ?? ""); // format YYYY-MM
  const dateTache = String(formData.get("date_tache") ?? "");
  const prestataireId = String(formData.get("prestataire_id") ?? "").trim();
  const typeRemuneration = String(formData.get("type_remuneration") ?? "") as TypeRemuneration;
  const projetIdRaw = String(formData.get("projet_id") ?? "").trim();

  let montant = 0;
  let description = "";
  let sousType: string | null = null;
  let quantite: number | null = null;
  let pourcentageRemuneration: number | null = null;
  let pourcentageEffectue: number | null = null;
  let projetId: string | null = projetIdRaw.length ? projetIdRaw : null;

  if (typeRemuneration === "monteur") {
    sousType = String(formData.get("sous_type") ?? "");

    if (sousType === "sur_mesure") {
      description = String(formData.get("description") ?? "").trim();
      montant = Number(formData.get("montant") ?? 0);
    } else {
      quantite = Number(formData.get("quantite") ?? 0);
      const { data: tarif, error: tarifError } = await supabase
        .from("tarifs_monteur")
        .select("*")
        .eq("cle", sousType)
        .single();
      if (tarifError || !tarif) throw new Error("Tarif introuvable pour ce type de vidéo.");
      montant = quantite * Number(tarif.prix);
      description = `${tarif.libelle} x${quantite}`;
    }
  } else if (typeRemuneration === "graphiste") {
    description = String(formData.get("description") ?? "").trim();
    montant = Number(formData.get("montant") ?? 0);
  } else if (typeRemuneration === "chef_de_projet") {
    if (!projetId) throw new Error("Un projet est requis pour un chef de projet.");
    pourcentageRemuneration = Number(formData.get("pourcentage_remuneration") ?? 0);
    pourcentageEffectue = Number(formData.get("pourcentage_effectue") ?? 0);

    const { data: projet, error: projetError } = await supabase
      .from("projets")
      .select("*, offres(*)")
      .eq("id", projetId)
      .single();
    if (projetError || !projet) throw new Error("Projet introuvable.");

    const prixOffre = Number(projet.offres?.prix ?? 0);
    montant = prixOffre * (pourcentageRemuneration / 100) * (pourcentageEffectue / 100);
    description = `Chef de projet — ${pourcentageRemuneration}% × ${pourcentageEffectue}% effectué`;
  } else {
    throw new Error("Type de rémunération invalide.");
  }

  const { error } = await supabase.from("taches_prestataires").insert({
    prestataire_id: prestataireId,
    projet_id: projetId,
    mois: `${mois}-01`,
    description,
    montant,
    date_tache: dateTache.length ? dateTache : new Date().toISOString().slice(0, 10),
    type_remuneration: typeRemuneration,
    sous_type: sousType,
    quantite,
    pourcentage_remuneration: pourcentageRemuneration,
    pourcentage_effectue: pourcentageEffectue,
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

export async function toggleTachePaye(tacheId: string, paye: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("taches_prestataires").update({ paye }).eq("id", tacheId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/paiements");
}

export async function updateTarifsMonteur(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const premium = Number(formData.get("prix_video_premium") ?? 0);
  const classique = Number(formData.get("prix_video_classique") ?? 0);

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("tarifs_monteur").update({ prix: premium, updated_at: new Date().toISOString() }).eq("cle", "video_premium"),
    supabase.from("tarifs_monteur").update({ prix: classique, updated_at: new Date().toISOString() }).eq("cle", "video_classique"),
  ]);

  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  revalidatePath("/admin/paiements");
}
