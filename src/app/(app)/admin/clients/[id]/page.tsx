import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateClientEntry } from "../actions";

export default async function EditClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const boundUpdate = updateClientEntry.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clients" className="text-sm text-zinc-500 hover:underline">
          ← Clients
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Modifier le client</h1>
      </div>

      <form action={boundUpdate} className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5">
        <Field label="Nom">
          <input name="nom" defaultValue={client.nom} required className="input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={client.email ?? ""} className="input" />
        </Field>
        <Field label="Téléphone">
          <input name="telephone" defaultValue={client.telephone ?? ""} className="input" />
        </Field>
        <Field label="Notes">
          <textarea name="notes" defaultValue={client.notes ?? ""} rows={3} className="input" />
        </Field>
        <button
          type="submit"
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Enregistrer
        </button>
      </form>
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
