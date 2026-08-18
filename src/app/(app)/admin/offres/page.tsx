import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Offre } from "@/types/database";
import { createOffreEntry, deleteOffreEntry } from "./actions";
import Link from "next/link";

export default async function OffresAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: offres } = await supabase.from("offres").select("*").order("nom");
  const list = (offres ?? []) as Offre[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Offres</h1>

      <form action={createOffreEntry} className="grid grid-cols-5 gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <input name="nom" placeholder="Nom de l'offre" required className="input" />
        <input name="description" placeholder="Description" className="input" />
        <input name="prix" type="number" step="0.01" placeholder="Prix (€)" className="input" />
        <select name="type_interview" defaultValue="courte" className="input">
          <option value="courte">Interview courte</option>
          <option value="longue">Interview longue</option>
        </select>
        <button type="submit" className="rounded-full bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-sky-dark">
          Ajouter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Nom</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Prix</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Interview</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{o.nom}</td>
                <td className="max-w-xs truncate px-4 py-3 text-zinc-600">{o.description ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{o.prix != null ? `${o.prix} €` : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                  {o.type_interview === "longue" ? "Longue (8 questions)" : "Courte (4 questions)"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/offres/${o.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Modifier
                    </Link>
                    <DeleteButton id={o.id} />
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
    await deleteOffreEntry(id);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
