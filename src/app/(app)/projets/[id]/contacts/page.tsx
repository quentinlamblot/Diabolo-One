import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Interviewe, IntervieweChamp, Statut } from "@/types/database";
import { AddIntervieweForm } from "./AddIntervieweForm";
import { AddColumnForm } from "./AddColumnForm";
import { ImportContactsForm } from "./ImportContactsForm";
import { IntervieweRow } from "./IntervieweRow";
import {
  createInterviewe,
  updateInterviewe,
  updateIntervieweStatut,
  deleteInterviewe,
  importInterviewes,
  createIntervieweChamp,
  deleteIntervieweChamp,
} from "./actions";

export default async function ContactsPage({ params }: PageProps<"/projets/[id]/contacts">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projet } = await supabase.from("projets").select("id, nom").eq("id", id).single();
  if (!projet) notFound();

  const [{ data: interviewes }, { data: statuts }, { data: champs }] = await Promise.all([
    supabase
      .from("interviewes")
      .select("*, statuts(*)")
      .eq("projet_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("statuts").select("*").eq("type", "interviewe").order("ordre"),
    supabase.from("interviewe_champs").select("*").order("ordre"),
  ]);

  const list = (interviewes ?? []) as Interviewe[];
  const statutList = (statuts ?? []) as Statut[];
  const champList = (champs ?? []) as IntervieweChamp[];
  const champIds = champList.map((c) => c.id);

  const boundCreate = async (formData: FormData) => {
    "use server";
    await createInterviewe(id, formData);
  };

  const boundImport = async (formData: FormData) => {
    "use server";
    return importInterviewes(id, formData);
  };

  const boundAddColumn = async (formData: FormData) => {
    "use server";
    await createIntervieweChamp(formData);
  };

  const canAdd = profile.role === "admin" || profile.role === "client";
  const canEditInfo = profile.role === "admin" || profile.role === "client";
  const canEditStatut = profile.role === "admin" || profile.role === "prestataire";
  const canDelete = profile.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/projets/${id}`} className="text-sm text-zinc-500 hover:underline">
          ← {projet.nom}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Suivi des contacts</h1>
        <p className="text-sm text-zinc-500">
          {list.length} personne{list.length > 1 ? "s" : ""} à interviewer
        </p>
      </div>

      {canAdd && (
        <div className="flex flex-col gap-4">
          <AddIntervieweForm statuts={statutList} action={boundCreate} />
          <ImportContactsForm action={boundImport} />
        </div>
      )}

      {profile.role === "admin" && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
          <AddColumnForm action={boundAddColumn} />
          {champList.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {champList.map((c) => {
                const boundDeleteColumn = async () => {
                  "use server";
                  await deleteIntervieweChamp(c.id);
                };
                return (
                  <form key={c.id} action={boundDeleteColumn} className="flex items-center gap-1 text-xs text-zinc-500">
                    {c.label}
                    <button type="submit" className="text-zinc-400 hover:text-red-600" aria-label={`Supprimer la colonne ${c.label}`}>
                      ×
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun contact pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <Th>Prénom</Th>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Téléphone</Th>
                <Th>Date du RDV</Th>
                <Th>Statut</Th>
                <Th>Notes</Th>
                {champList.map((c) => (
                  <Th key={c.id}>{c.label}</Th>
                ))}
                {(canEditInfo || canDelete) && <Th />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((i) => {
                const boundUpdate = async (formData: FormData) => {
                  "use server";
                  await updateInterviewe(id, i.id, champIds, formData);
                };
                const boundStatut = async (statutId: string) => {
                  "use server";
                  await updateIntervieweStatut(id, i.id, statutId);
                };
                const boundDelete = async () => {
                  "use server";
                  await deleteInterviewe(id, i.id);
                };
                return (
                  <IntervieweRow
                    key={i.id}
                    interviewe={i}
                    champs={champList}
                    statuts={statutList}
                    canEditInfo={canEditInfo}
                    canEditStatut={canEditStatut}
                    canDelete={canDelete}
                    updateAction={boundUpdate}
                    statutAction={boundStatut}
                    deleteAction={boundDelete}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </th>
  );
}
