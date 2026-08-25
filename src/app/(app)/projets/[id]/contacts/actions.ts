"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/auth";
import { notifierChefDeProjet } from "@/lib/notifications";
import { defaultVideoTitre } from "@/lib/videoTitre";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function canEditInfo(role: string) {
  return role === "admin" || role === "client";
}

// Synchro contact -> vidéo (sens inverse de la synchro vidéo -> contact) :
// quand le statut d'un contact atteint une étape mappée (Gestion > Statuts),
// sa vidéo liée avance, ou est créée si elle n'existe pas encore — pour ne
// plus avoir à créer une vidéo à la main puis lui choisir un contact.
// Jamais de retour en arrière automatique.
async function syncVideoSelonStatutContact(supabase: SupabaseServerClient, intervieweId: string) {
  const { data: contact } = await supabase
    .from("interviewes")
    .select("projet_id, prenom, nom, date_rdv, statuts(statut_video_lie_id)")
    .eq("id", intervieweId)
    .single();
  if (!contact) return;
  const statut = Array.isArray(contact.statuts) ? contact.statuts[0] : contact.statuts;
  const cibleId = statut?.statut_video_lie_id;
  if (!cibleId) return;

  const [{ data: cible }, { data: videoExistante }] = await Promise.all([
    supabase.from("statuts").select("ordre").eq("id", cibleId).single(),
    supabase.from("videos").select("id, statuts(ordre)").eq("interviewe_id", intervieweId).limit(1).maybeSingle(),
  ]);
  if (!cible) return;

  if (videoExistante) {
    const statutActuel = Array.isArray(videoExistante.statuts) ? videoExistante.statuts[0] : videoExistante.statuts;
    if (statutActuel && statutActuel.ordre >= cible.ordre) return;
    await supabase.from("videos").update({ statut_id: cibleId, date_tournage: contact.date_rdv }).eq("id", videoExistante.id);
    return;
  }

  const newId = randomUUID();
  await supabase.from("videos").insert({
    id: newId,
    projet_id: contact.projet_id,
    titre: defaultVideoTitre(contact.prenom, contact.nom, newId),
    statut_id: cibleId,
    interviewe_id: intervieweId,
    date_tournage: contact.date_rdv,
  });
}

// Le tournage d'une vidéo doit toujours avoir lieu à la date de RDV du
// contact : sans ça, "en retard" reste calculé sur une date de tournage
// périmée dès que le RDV est déplacé côté contact.
async function syncDateVersVideo(supabase: SupabaseServerClient, intervieweId: string, dateRdv: string | null) {
  if (!dateRdv) return;
  await supabase.from("videos").update({ date_tournage: dateRdv }).eq("interviewe_id", intervieweId);
}

export async function createInterviewe(projetId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const nom = str(formData, "nom");
  const prenom = str(formData, "prenom");
  const { data: created, error } = await supabase
    .from("interviewes")
    .insert({
      projet_id: projetId,
      nom,
      prenom,
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      statut_id: str(formData, "statut_id"),
      date_rdv: str(formData, "date_rdv"),
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await syncVideoSelonStatutContact(supabase, created.id);

  if (profile.role === "client") {
    const nomComplet = [prenom, nom].filter(Boolean).join(" ") || "Nouveau contact";
    await notifierChefDeProjet(supabase, projetId, "Le client a ajouté un contact", [
      `Le client a ajouté <strong>${nomComplet}</strong> à la liste de contacts.`,
    ]);
  }

  revalidatePath(`/projets/${projetId}/contacts`);
  revalidatePath(`/projets/${projetId}/videos`);
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
  const dateRdv = str(formData, "date_rdv");
  const { error } = await supabase
    .from("interviewes")
    .update({
      nom: str(formData, "nom"),
      prenom: str(formData, "prenom"),
      email: str(formData, "email"),
      telephone: str(formData, "telephone"),
      date_rdv: dateRdv,
      notes: str(formData, "notes"),
      custom_fields: customFields,
    })
    .eq("id", intervieweId);

  if (error) throw new Error(error.message);

  await syncDateVersVideo(supabase, intervieweId, dateRdv);

  revalidatePath(`/projets/${projetId}/contacts`);
  revalidatePath(`/projets/${projetId}/videos`);
}

export async function updateIntervieweStatut(projetId: string, intervieweId: string, statutId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviewes")
    .update({ statut_id: statutId })
    .eq("id", intervieweId);

  if (error) throw new Error(error.message);

  await syncVideoSelonStatutContact(supabase, intervieweId);

  revalidatePath(`/projets/${projetId}/contacts`);
  revalidatePath(`/projets/${projetId}/videos`);
}

export async function createIntervieweChamp(formData: FormData) {
  await requireAdmin();
  const label = str(formData, "label");
  if (!label) throw new Error("Libellé requis.");
  const type = str(formData, "type") === "liste" ? "liste" : "texte";
  const options =
    type === "liste"
      ? (str(formData, "options") ?? "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : [];

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("interviewe_champs")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1);
  const nextOrdre = (existing?.[0]?.ordre ?? -1) + 1;

  const { error } = await supabase.from("interviewe_champs").insert({ label, ordre: nextOrdre, type, options });
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
    const { data: insered, error } = await supabase.from("interviewes").insert(toInsert).select("id");
    if (error) throw new Error(error.message);

    for (const row of insered ?? []) {
      await syncVideoSelonStatutContact(supabase, row.id);
    }

    if (profile.role === "client") {
      await notifierChefDeProjet(supabase, projetId, "Le client a importé des contacts", [
        `Le client a importé <strong>${toInsert.length}</strong> contact(s) dans la liste de contacts.`,
      ]);
    }
  }

  revalidatePath(`/projets/${projetId}/contacts`);
  revalidatePath(`/projets/${projetId}/videos`);
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
