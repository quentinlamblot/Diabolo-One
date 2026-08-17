import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Profile, Client, Prestataire } from "@/types/database";
import { UserForm } from "./UserForm";
import { createUserEntry, deleteUserEntry } from "./actions";
import Link from "next/link";

export default async function UtilisateursAdminPage() {
  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: clients }, { data: prestataires }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("clients").select("*").order("nom"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);

  const list = (profiles ?? []) as Profile[];
  const clientList = (clients ?? []) as Client[];
  const prestataireList = (prestataires ?? []) as Prestataire[];

  const roleLabel: Record<string, string> = { admin: "Admin", prestataire: "Prestataire", client: "Client" };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Utilisateurs</h1>

      <UserForm clients={clientList} prestataires={prestataireList} action={createUserEntry} />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Nom</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Rôle</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {list.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{p.full_name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{p.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{roleLabel[p.role]}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/utilisateurs/${p.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Modifier
                    </Link>
                    {p.id !== me.id && <DeleteButton id={p.id} />}
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
    await deleteUserEntry(id);
  };
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-medium text-red-500 hover:underline">
        Supprimer
      </button>
    </form>
  );
}
