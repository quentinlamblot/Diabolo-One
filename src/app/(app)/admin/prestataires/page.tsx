import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Prestataire } from "@/types/database";
import { createPrestataireEntry, deletePrestataireEntry } from "./actions";
import Link from "next/link";

export default async function PrestatairesAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: prestataires } = await supabase.from("prestataires").select("*").order("nom");
  const list = (prestataires ?? []) as Prestataire[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Prestataires</h1>

      <form
        action={createPrestataireEntry}
        className="grid grid-cols-5 gap-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <input name="nom" placeholder="Nom" required className="input" />
        <input name="email" type="email" placeholder="Email" className="input" />
        <input name="telephone" placeholder="Téléphone" className="input" />
        <input name="notes" placeholder="Notes" className="input" />
        <button type="submit" className="rounded-full bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-sky-dark">
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
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{p.nom}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.email ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.telephone ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/prestataires/${p.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Modifier
                    </Link>
                    <DeleteButton id={p.id} />
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
    await deletePrestataireEntry(id);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
