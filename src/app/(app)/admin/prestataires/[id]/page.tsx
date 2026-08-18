import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updatePrestataireEntry } from "../actions";
import { AutosaveForm } from "@/components/AutosaveForm";

export default async function EditPrestatairePage({ params }: PageProps<"/admin/prestataires/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: prestataire } = await supabase.from("prestataires").select("*").eq("id", id).single();
  if (!prestataire) notFound();

  const boundUpdate = updatePrestataireEntry.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/prestataires" className="text-sm text-zinc-500 hover:underline">
          ← Prestataires
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Modifier le prestataire</h1>
      </div>

      <AutosaveForm action={boundUpdate} className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <Field label="Nom">
          <input name="nom" defaultValue={prestataire.nom} required className="input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={prestataire.email ?? ""} className="input" />
        </Field>
        <Field label="Téléphone">
          <input name="telephone" defaultValue={prestataire.telephone ?? ""} className="input" />
        </Field>
        <Field label="Notes">
          <textarea name="notes" defaultValue={prestataire.notes ?? ""} rows={3} className="input" />
        </Field>
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
