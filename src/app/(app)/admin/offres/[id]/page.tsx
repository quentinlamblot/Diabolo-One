import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateOffreEntry } from "../actions";
import { AutosaveForm } from "@/components/AutosaveForm";

export default async function EditOffrePage({ params }: PageProps<"/admin/offres/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: offre } = await supabase.from("offres").select("*").eq("id", id).single();
  if (!offre) notFound();

  const boundUpdate = updateOffreEntry.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/offres" className="text-sm text-zinc-500 hover:underline">
          ← Offres
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Modifier l&apos;offre</h1>
      </div>

      <AutosaveForm action={boundUpdate} className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <Field label="Nom">
          <input name="nom" defaultValue={offre.nom} required className="input" />
        </Field>
        <Field label="Description">
          <input name="description" defaultValue={offre.description ?? ""} className="input" />
        </Field>
        <Field label="Prix (€)">
          <input name="prix" type="number" step="0.01" defaultValue={offre.prix ?? ""} className="input" />
        </Field>
        <Field label="Type d'interview">
          <select name="type_interview" defaultValue={offre.type_interview} className="input">
            <option value="courte">Courte (4 questions)</option>
            <option value="longue">Longue (8 questions)</option>
          </select>
        </Field>
        <Field label="Tarif monteur">
          <select name="sous_type_monteur" defaultValue={offre.sous_type_monteur ?? ""} className="input">
            <option value="">— Non défini —</option>
            <option value="video_classique">Tarif classique</option>
            <option value="video_premium">Tarif premium</option>
          </select>
        </Field>
        <p className="-mt-2 text-xs text-zinc-500">
          Détermine le montant versé automatiquement au monteur quand une vidéo de cette offre est livrée.
        </p>
      </AutosaveForm>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
