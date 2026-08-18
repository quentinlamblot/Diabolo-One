import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import type { Client, Offre, Statut, Projet, Prestataire, OnboardingReponse } from "@/types/database";
import { ProjetForm } from "../ProjetForm";
import { updateProjet, deleteProjet, assignPrestataire, unassignPrestataire } from "../actions";
import { DeleteButton } from "./DeleteButton";
import { AssignPrestataire } from "./AssignPrestataire";
import { ONBOARDING_SECTIONS } from "../../onboarding/questions";

export default async function ProjetDetailPage({ params }: PageProps<"/projets/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: projet }, { data: videoCounts }] = await Promise.all([
    supabase.from("projets").select("*, clients(*), offres(*), statuts(*)").eq("id", id).single(),
    supabase.from("videos").select("statuts(label, couleur)").eq("projet_id", id),
  ]);

  if (!projet) notFound();

  const boundUpdate = updateProjet.bind(null, id);
  const boundDelete = deleteProjet.bind(null, id);
  const boundAssign = async (formData: FormData) => {
    "use server";
    await assignPrestataire(id, String(formData.get("prestataire_id")), String(formData.get("commentaire") ?? ""));
  };

  if (profile.role === "admin") {
    const [{ data: clients }, { data: offres }, { data: statuts }, { data: assignations }, { data: allPrestataires }, { data: onboarding }] =
      await Promise.all([
        supabase.from("clients").select("*").order("nom"),
        supabase.from("offres").select("*").order("nom"),
        supabase.from("statuts").select("*").eq("type", "projet").order("ordre"),
        supabase.from("projet_prestataires").select("*, prestataires(*)").eq("projet_id", id),
        supabase.from("prestataires").select("*").order("nom"),
        supabase.from("onboarding_reponses").select("*").eq("projet_id", id).maybeSingle(),
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
            <p className="text-sm text-zinc-500">
              {countLivrees(videoCounts ?? [])} vidéo(s) livrée(s) sur {projet.nombre_commande} commandée(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projets/${id}/videos`}
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Vidéos
            </Link>
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

        {onboarding && <BriefClient reponses={(onboarding as OnboardingReponse).reponses} />}
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
        <ProjetReadonly projet={projet as Projet} videoCounts={videoCounts ?? []} />
        <div className="flex gap-2">
          <Link
            href={`/projets/${id}/videos`}
            className="w-fit rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          >
            Vidéos
          </Link>
          <Link
            href={`/projets/${id}/contacts`}
            className="w-fit rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          >
            Suivi des contacts
          </Link>
        </div>
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
      <ProjetReadonly projet={projet as Projet} videoCounts={videoCounts ?? []} />
      <div className="flex gap-2">
        <Link
          href={`/projets/${id}/videos`}
          className="w-fit rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark"
        >
          Vidéos
        </Link>
        <Link
          href={`/projets/${id}/contacts`}
          className="w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          Suivi des contacts
        </Link>
      </div>
    </div>
  );
}

type VideoCountRow = { statuts: { label: string; couleur: string }[] | { label: string; couleur: string } | null };

function groupVideoCounts(videoCounts: VideoCountRow[]) {
  const counts = new Map<string, { count: number; couleur: string }>();
  for (const v of videoCounts) {
    const statut = Array.isArray(v.statuts) ? v.statuts[0] : v.statuts;
    if (!statut) continue;
    const entry = counts.get(statut.label) ?? { count: 0, couleur: statut.couleur };
    entry.count += 1;
    counts.set(statut.label, entry);
  }
  return counts;
}

function countLivrees(videoCounts: VideoCountRow[]) {
  return groupVideoCounts(videoCounts).get("Livré")?.count ?? 0;
}

function ProjetReadonly({ projet, videoCounts }: { projet: Projet; videoCounts: VideoCountRow[] }) {
  const counts = groupVideoCounts(videoCounts);
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
      <Info
        label="Vidéos commandées / livrées"
        value={`${projet.nombre_commande} / ${counts.get("Livré")?.count ?? 0}`}
      />
      <div className="col-span-2">
        <Info
          label="Détail par statut"
          value={
            counts.size === 0 ? (
              "—"
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(counts.entries()).map(([label, { count, couleur }]) => (
                  <Badge key={label} label={`${label} · ${count}`} color={couleur} />
                ))}
              </div>
            )
          }
        />
      </div>
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

function BriefClient({ reponses }: { reponses: Record<string, string> }) {
  return (
    <details className="rounded-lg border border-zinc-200 bg-white p-5">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Brief client (onboarding)</summary>
      <div className="mt-4 flex flex-col gap-5">
        {ONBOARDING_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-dark">{section.title}</h3>
            <div className="flex flex-col gap-2">
              {section.questions.map((q) => (
                <Info key={q.key} label={q.label} value={reponses[q.key] || "—"} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
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
