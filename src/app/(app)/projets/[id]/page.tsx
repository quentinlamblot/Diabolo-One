import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import type { Client, Offre, Statut, Projet, Prestataire } from "@/types/database";
import { ProjetForm } from "../ProjetForm";
import { updateProjet, deleteProjet, assignPrestataire, unassignPrestataire } from "../actions";
import { PrestaCountsForm } from "./PrestaCountsForm";
import { DeleteButton } from "./DeleteButton";
import { AssignPrestataire } from "./AssignPrestataire";

export default async function ProjetDetailPage({ params }: PageProps<"/projets/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: projet } = await supabase
    .from("projets")
    .select("*, clients(*), offres(*), statuts(*)")
    .eq("id", id)
    .single();

  if (!projet) notFound();

  const boundUpdate = updateProjet.bind(null, id);
  const boundDelete = deleteProjet.bind(null, id);
  const boundAssign = async (formData: FormData) => {
    "use server";
    await assignPrestataire(id, String(formData.get("prestataire_id")), String(formData.get("commentaire") ?? ""));
  };

  if (profile.role === "admin") {
    const [{ data: clients }, { data: offres }, { data: statuts }, { data: assignations }, { data: allPrestataires }] =
      await Promise.all([
        supabase.from("clients").select("*").order("nom"),
        supabase.from("offres").select("*").order("nom"),
        supabase.from("statuts").select("*").eq("type", "projet").order("ordre"),
        supabase.from("projet_prestataires").select("*, prestataires(*)").eq("projet_id", id),
        supabase.from("prestataires").select("*").order("nom"),
      ]);

    const assignedIds = new Set((assignations ?? []).map((a) => a.prestataire_id));
    const available = ((allPrestataires ?? []) as Prestataire[]).filter((p) => !assignedIds.has(p.id));

    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/projets" className="text-sm text-zinc-500 hover:underline">
              ← Projets
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{projet.nom}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projets/${id}/contacts`}
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Suivi des contacts
            </Link>
            <DeleteButton action={boundDelete} />
          </div>
        </div>

        <ProjetForm
          clients={(clients ?? []) as Client[]}
          offres={(offres ?? []) as Offre[]}
          statuts={(statuts ?? []) as Statut[]}
          projet={projet as Projet}
          action={boundUpdate}
          autosave
        />

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Prestataires affectés</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {(assignations ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">Aucun prestataire affecté.</p>
            )}
            {(assignations ?? []).map((a) => (
              <span
                key={a.prestataire_id}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
              >
                {a.prestataires?.nom}
                <UnassignButton projetId={id} prestataireId={a.prestataire_id} />
              </span>
            ))}
          </div>
          <AssignPrestataire available={available} action={boundAssign} />
        </div>
      </div>
    );
  }

  if (profile.role === "prestataire") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/projets" className="text-sm text-zinc-500 hover:underline">
            ← Projets
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{projet.nom}</h1>
        </div>
        <ProjetReadonly projet={projet as Projet} />
        <PrestaCountsForm projet={projet as Projet} action={boundUpdate} />
        <Link
          href={`/projets/${id}/contacts`}
          className="w-fit rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          Suivi des contacts
        </Link>
      </div>
    );
  }

  // client
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/projets" className="text-sm text-zinc-500 hover:underline">
          ← Projets
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{projet.nom}</h1>
      </div>
      <ProjetReadonly projet={projet as Projet} />
      <Link
        href={`/projets/${id}/contacts`}
        className="w-fit rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark"
      >
        Suivi des contacts
      </Link>
    </div>
  );
}

function ProjetReadonly({ projet }: { projet: Projet }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-5 text-sm">
      <Info label="Offre" value={projet.offres?.nom ?? "—"} />
      <Info label="Format" value={projet.format} />
      <Info label="Durée moyenne" value={projet.duree_moyenne ?? "—"} />
      <Info
        label="Statut"
        value={projet.statuts ? <Badge label={projet.statuts.label} color={projet.statuts.couleur} /> : "—"}
      />
      <Info
        label="Charte graphique"
        value={
          <Badge
            label={projet.charte_graphique === "ok" ? "OK" : "En attente"}
            color={projet.charte_graphique === "ok" ? "#22c55e" : "#f59e0b"}
          />
        }
      />
      <Info label="Prévu / Booké / Tourné / À monter / Terminé"
        value={`${projet.nombre_prevu} / ${projet.nombre_booke} / ${projet.nombre_tourne} / ${projet.nombre_a_monter} / ${projet.nombre_termine}`}
      />
      {projet.lien_edito && (
        <Info label="Lien édito" value={<a className="text-blue-600 hover:underline" href={projet.lien_edito} target="_blank">{projet.lien_edito}</a>} />
      )}
      {projet.lien_riverside && (
        <Info label="Lien Riverside" value={<a className="text-blue-600 hover:underline" href={projet.lien_riverside} target="_blank">{projet.lien_riverside}</a>} />
      )}
      {projet.infos_complementaires && (
        <div className="col-span-2">
          <Info label="Informations complémentaires" value={projet.infos_complementaires} />
        </div>
      )}
      {projet.instructions_individuelles && (
        <div className="col-span-2">
          <Info label="Instructions individuelles" value={projet.instructions_individuelles} />
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5 text-zinc-800">{value}</div>
    </div>
  );
}

function UnassignButton({ projetId, prestataireId }: { projetId: string; prestataireId: string }) {
  const action = async () => {
    "use server";
    await unassignPrestataire(projetId, prestataireId);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-zinc-400 hover:text-red-600" aria-label="Retirer">
        ×
      </button>
    </form>
  );
}
