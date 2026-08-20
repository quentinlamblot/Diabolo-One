"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/auth";
import { notifierChefDeProjet } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function canEditInfo(role: string) {
  return role === "admin" || role === "client";
}

export async function createInterviewe(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const nom = str(formData, "nom");
  const prenom = str(formData, "prenom");
  const { error } = await supabase.from("interviewes").insert({
    projet_id: projetId,
    nom,
    prenom,
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    statut_id: str(formData, "statut_id"),
    date_rdv: str(formData, "date_rdv"),
    notes: str(formData, "notes"),
  });

  if (error) throw new Error(error.message);

  if (profile.role === "client") {
    const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Nouveau contact";
    await notifierChefDeProjet(supabase, projetId, "Le client a ajouté un contact", [
      `Le client a ajouté <strong>${nomComplet}</strong> à la liste de contacts.`,
    ]);
  }

  revalidatePath(`/projets/${projetId}/contacts`);
}

export async function updateInterviewe(
  projetId: string,
  intervieweId: string,
  champIds: string[],
  formData: FormData
) {
  const profile = await requireProfile();
  if (!canEditInfo(profile.role)) throw new Error("Non autorisé");

  const customFields: Record<string, string> = {};
  for (const champId of champIds) {
    const v = str(formData, `champ_${champId}`);
    if (v !== null) customFields[champId] = v;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("interviewes")
    .update({
      nom: str(formData, "nom"),
      prenom: str(formData, "prenom"),
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      date_rdv: str(formData, "date_rdv"),
      notes: str(formData, "notes"),
      custom_fields: customFields,
    })
    .eq("id", intervieweId);

  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}

export async function updateIntervieweStatut(projetId: string, intervieweId: string, statutId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviewes")
    .update({ statut_id: statutId })
    .eq("id", intervieweId);

  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}

export async function createIntervieweChamp(formData: FormData) {
  await requireAdmin();
  const label = str(formData, "label");
  if (!label) throw new Error("Libellé requis.");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("interviewe_champs")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1);
  const nextOrdre = (existing?.[0]?.ordre ?? -1) + 1;

  const { error } = await supabase.from("interviewe_champs").insert({ label, ordre: nextOrdre });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function deleteIntervieweChamp(champId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("interviewe_champs").delete().eq("id", champId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

interface ColumnMapping {
  header: string;
  target: string; // "ignore" | "prenom" | "nom" | "email" | "telephone" | "date_rdv" | "statut" | "new" | `existing:${id}`
  customLabel: string;
}

export async function importInterviewes(
  projetId: string,
  formData: FormData
): Promise<{ imported: number; skipped: number }> {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "client") throw new Error("Non autorisé");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier manquant.");

  const mappingRaw = str(formData, "mapping");
  if (!mappingRaw) throw new Error("Correspondance des colonnes manquante.");
  const mapping = JSON.parse(mappingRaw) as ColumnMapping[];
  const headerRowIndex = Number(formData.get("headerRowIndex") ?? 0);

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Ce fichier ne contient aucune feuille lisible.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  // Les lignes avant et sur la ligne d'en-têtes (détectée côté client) sont ignorées.
  const dataRows = rows.slice(headerRowIndex + 1);

  const supabase = await createClient();

  if (profile.role === "client") {
    const { data: projet } = await supabase.from("projets").select("id").eq("id", projetId).single();
    if (!projet) throw new Error("Non autorisé");
  }

  const { data: statuts } = await supabase.from("statuts").select("*").eq("type", "interviewe");
  const statutByLabel = new Map((statuts ?? []).map((s) => [s.label.trim().toLowerCase(), s.id]));

  // Crée les nouvelles colonnes personnalisées demandées et résout chaque
  // colonne "new"/"existing:<id>" vers un id de champ définitif.
  const { data: existingOrdreRows } = await supabase
    .from("interviewe_champs")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1);
  let nextOrdre = (existingOrdreRows?.[0]?.ordre ?? -1) + 1;

  const champIdByColumnIndex = new Map<number, string>();
  for (let i = 0; i < mapping.length; i++) {
    const col = mapping[i];
    if (col.target === "new") {
      const label = col.customLabel.trim() || col.header;
      const { data: created, error } = await supabase
        .from("interviewe_champs")
        .insert({ label, ordre: nextOrdre++ })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      champIdByColumnIndex.set(i, created.id);
    } else if (col.target.startsWith("existing:")) {
      champIdByColumnIndex.set(i, col.target.slice("existing:".length));
    }
  }

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    const customFields: Record<string, string> = {};
    let nom: string | null = null;
    let prenom: string | null = null;
    let email: string | null = null;
    let telephone: string | null = null;
    let dateRdv: string | null = null;
    let statutId: string | null = null;
    let hasAnyValue = false;

    for (let i = 0; i < mapping.length; i++) {
      const col = mapping[i];
      const raw = row[i];
      const value = raw === undefined || raw === null ? "" : String(raw).trim();
      if (!value) continue;
      hasAnyValue = true;

      if (col.target === "prenom") prenom = value;
      else if (col.target === "nom") nom = value;
      else if (col.target === "email") email = value;
      else if (col.target === "telephone") telephone = value;
      else if (col.target === "date_rdv") dateRdv = value;
      else if (col.target === "statut") statutId = statutByLabel.get(value.toLowerCase()) ?? null;
      else if (champIdByColumnIndex.has(i)) customFields[champIdByColumnIndex.get(i)!] = value;
    }

    if (!hasAnyValue) {
      skipped++;
      continue;
    }

    toInsert.push({
      projet_id: projetId,
      nom,
      prenom,
      email,
      telephone,
      date_rdv: dateRdv,
      statut_id: statutId,
      custom_fields: customFields,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("interviewes").insert(toInsert);
    if (error) throw new Error(error.message);

    if (profile.role === "client") {
      await notifierChefDeProjet(supabase, projetId, "Le client a importé des contacts", [
        `Le client a importé <strong>${toInsert.length}</strong> contact(s) dans la liste de contacts.`,
      ]);
    }
  }

  revalidatePath(`/projets/${projetId}/contacts`);
  revalidatePath("/", "layout");
  return { imported: toInsert.length, skipped };
}

export async function deleteInterviewe(projetId: string, intervieweId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") throw new Error("Non autorisé");

  const supabase = await createClient();
  const { error } = await supabase.from("interviewes").delete().eq("id", intervieweId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projets/${projetId}/contacts`);
}
