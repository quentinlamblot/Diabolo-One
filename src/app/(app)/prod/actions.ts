"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProdStatut } from "@/types/database";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function num(formData: FormData, key: string): number | null {
  const v = formData.get(key);
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createProdProjet(formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prod_projets")
    .insert({
      nom: str(formData, "nom") ?? "Projet sans titre",
      client: str(formData, "client"),
      type_prestation: str(formData, "type_prestation"),
      date_prestation: str(formData, "date_prestation"),
      statut: (str(formData, "statut") as ProdStatut) ?? "a_venir",
      valeur_deal: num(formData, "valeur_deal"),
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/prod");
  redirect(`/prod/${data.id}`);
}

export async function updateProdProjet(projetId: string, formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("prod_projets")
    .update({
      nom: str(formData, "nom") ?? "Projet sans titre",
      client: str(formData, "client"),
      type_prestation: str(formData, "type_prestation"),
      date_prestation: str(formData, "date_prestation"),
      statut: (str(formData, "statut") as ProdStatut) ?? "a_venir",
      valeur_deal: num(formData, "valeur_deal"),
      notes: str(formData, "notes"),
    })
    .eq("id", projetId);
  if (error) throw new Error(error.message);

  revalidatePath("/prod");
  revalidatePath(`/prod/${projetId}`);
}

export async function deleteProdProjet(projetId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prod_projets").delete().eq("id", projetId);
  if (error) throw new Error(error.message);

  revalidatePath("/prod");
  redirect("/prod");
}

export async function assignPrestataireProd(projetId: string, formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const prestataireId = str(formData, "prestataire_id");
  if (!prestataireId) throw new Error("Prestataire requis.");

  const { error } = await supabase.from("prod_projet_prestataires").upsert(
    {
      prod_projet_id: projetId,
      prestataire_id: prestataireId,
      montant_du: num(formData, "montant_du"),
    },
    { onConflict: "prod_projet_id,prestataire_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/prod/${projetId}`);
}

export async function updatePrestataireProd(projetId: string, rowId: string, formData: FormData) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("prod_projet_prestataires")
    .update({
      montant_du: num(formData, "montant_du"),
      date_paiement: str(formData, "date_paiement"),
    })
    .eq("id", rowId);
  if (error) throw new Error(error.message);

  revalidatePath(`/prod/${projetId}`);
}

export async function removePrestataireProd(projetId: string, rowId: string) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("prod_projet_prestataires").delete().eq("id", rowId);
  if (error) throw new Error(error.message);

  revalidatePath(`/prod/${projetId}`);
}
