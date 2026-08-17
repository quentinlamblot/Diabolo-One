"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
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
    notes: str(formData, "notes"),
  });

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

    toInsert.push({
      projet_id: projetId,
      nom,
      prenom: String(normalized["prenom"] ?? "").trim() || null,
      email: String(normalized["email"] ?? "").trim() || null,
      telephone: String(normalized["telephone"] ?? normalized["tel"] ?? "").trim() || null,
      statut_id: statutLabel ? (statutByLabel.get(statutLabel) ?? null) : null,
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
