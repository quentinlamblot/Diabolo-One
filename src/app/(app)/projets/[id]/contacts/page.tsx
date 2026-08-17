import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Interviewe, Statut } from "@/types/database";
import { AddIntervieweForm } from "./AddIntervieweForm";
import { StatutSelect } from "./StatutSelect";
import { createInterviewe, updateIntervieweStatut, deleteInterviewe } from "./actions";

export default async function ContactsPage({ params }: PageProps<"/projets/[id]/contacts">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projet } = await supabase.from("projets").select("id, nom").eq("id", id).single();
  if (!projet) notFound();

  const [{ data: interviewes }, { data: statuts }] = await Promise.all([
    supabase
      .from("interviewes")
      .select("*, statuts(*)")
      .eq("projet_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("statuts").select("*").eq("type", "interviewe").order("ordre"),
  ]);

  const list = (interviewes ?? []) as Interviewe[];
  const statutList = (statuts ?? []) as Statut[];

  const boundCreate = async (formData: FormData) => {
    "use server";
    await createInterviewe(id, formData);
  };

  const canAdd = profile.role === "admin" || profile.role === "client";
  const canEditStatut = profile.role === "admin" || profile.role === "prestataire";

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

      {canAdd && <AddIntervieweForm statuts={statutList} action={boundCreate} />}

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
                <Th>Statut</Th>
                <Th>Notes</Th>
                {profile.role === "admin" && <Th />}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {list.map((i) => (
                <tr key={i.id} className="hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-800">{i.prenom ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{i.nom}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{i.email ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{i.telephone ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {canEditStatut ? (
                      <StatutSelectClient
                        projetId={id}
                        intervieweId={i.id}
                        statuts={statutList}
                        value={i.statut_id}
                      />
                    ) : i.statuts ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${i.statuts.couleur}22`, color: i.statuts.couleur }}
                      >
                        {i.statuts.label}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-600">{i.notes ?? "—"}</td>
                  {profile.role === "admin" && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <DeleteIntervieweButton projetId={id} intervieweId={i.id} />
                    </td>
                  )}
                </tr>
              ))}
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

function StatutSelectClient({
  projetId,
  intervieweId,
  statuts,
  value,
}: {
  projetId: string;
  intervieweId: string;
  statuts: Statut[];
  value: string | null;
}) {
  const onChange = async (statutId: string) => {
    "use server";
    await updateIntervieweStatut(projetId, intervieweId, statutId);
  };
  return <StatutSelect statuts={statuts} value={value} onChange={onChange} />;
}

function DeleteIntervieweButton({ projetId, intervieweId }: { projetId: string; intervieweId: string }) {
  const action = async () => {
    "use server";
    await deleteInterviewe(projetId, intervieweId);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
