"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/auth";
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
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("interviewes").insert({
    projet_id: projetId,
    nom: str(formData, "nom"),
    prenom: str(formData, "prenom"),
    email: str(formData, "email"),
    telephone: str(formData, "telephone"),
    statut_id: str(formData, "statut_id"),
    date_rdv: str(formData, "date_rdv"),
    notes: str(formData, "notes"),
  });

  if (error) throw new Error(error.message);
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

function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export async function importInterviewes(
  projetId: string,
  formData: FormData
): Promise<{ imported: number; skipped: number }> {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "client") throw new Error("Non autorisé");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier manquant.");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const supabase = await createClient();

  if (profile.role === "client") {
    const { data: projet } = await supabase.from("projets").select("id").eq("id", projetId).single();
    if (!projet) throw new Error("Non autorisé");
  }

  const { data: statuts } = await supabase.from("statuts").select("*").eq("type", "interviewe");
  const statutByLabel = new Map((statuts ?? []).map((s) => [s.label.trim().toLowerCase(), s.id]));

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of rows) {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }

    const nom = String(normalized["nom"] ?? "").trim();
    if (!nom) {
      skipped++;
      continue;
    }

    const statutLabel = String(normalized["statut"] ?? "").trim().toLowerCase();
    const dateRdvRaw = String(normalized["date du rdv"] ?? normalized["date rdv"] ?? normalized["daterdv"] ?? "").trim();

    toInsert.push({
      projet_id: projetId,
      nom,
      prenom: String(normalized["prenom"] ?? "").trim() || null,
      email: String(normalized["email"] ?? "").trim() || null,
      telephone: String(normalized["telephone"] ?? normalized["tel"] ?? "").trim() || null,
      statut_id: statutLabel ? (statutByLabel.get(statutLabel) ?? null) : null,
      date_rdv: dateRdvRaw || null,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("interviewes").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/projets/${projetId}/contacts`);
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
