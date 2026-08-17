import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Client } from "@/types/database";
import { createClientEntry, deleteClientEntry } from "./actions";
import Link from "next/link";

export default async function ClientsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("nom");
  const list = (clients ?? []) as Client[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>

      <form action={createClientEntry} className="grid grid-cols-5 gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <input name="nom" placeholder="Nom" required className="input" />
        <input name="email" type="email" placeholder="Email" className="input" />
        <input name="telephone" placeholder="Téléphone" className="input" />
        <input name="notes" placeholder="Notes" className="input" />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Ajouter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Nom</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Téléphone</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{c.nom}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{c.email ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{c.telephone ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-zinc-600">{c.notes ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/clients/${c.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Modifier
                    </Link>
                    <DeleteButton id={c.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const action = async () => {
    "use server";
    await deleteClientEntry(id);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
