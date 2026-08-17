import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Statut } from "@/types/database";
import { createStatutEntry, updateStatutEntry, deleteStatutEntry } from "./actions";
import { StatutItem } from "./StatutItem";

export default async function StatutsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: statuts } = await supabase.from("statuts").select("*").order("type").order("ordre");
  const list = (statuts ?? []) as Statut[];
  const projetStatuts = list.filter((s) => s.type === "projet");
  const intervieweStatuts = list.filter((s) => s.type === "interviewe");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Statuts</h1>

      <form action={createStatutEntry} className="grid grid-cols-6 gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <select name="type" required className="input">
          <option value="projet">Statut projet</option>
          <option value="interviewe">Statut interviewé</option>
        </select>
        <input name="label" placeholder="Libellé" required className="input" />
        <input name="couleur" type="color" defaultValue="#3b82f6" className="input h-10 p-1" />
        <select name="categorie" defaultValue="" className="input">
          <option value="">Pas de catégorie</option>
          <option value="vert">🟢 Vert</option>
          <option value="orange">🟠 Orange</option>
          <option value="rouge">🔴 Rouge</option>
        </select>
        <input name="ordre" type="number" placeholder="Ordre" defaultValue={0} className="input" />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Ajouter
        </button>
      </form>
      <p className="-mt-4 text-xs text-zinc-500">
        La catégorie (vert/orange/rouge) est utilisée pour colorer les lignes du tableau de suivi des contacts.
      </p>

      <StatutGroup title="Statuts projet" list={projetStatuts} />
      <StatutGroup title="Statuts interviewé" list={intervieweStatuts} />
    </div>
  );
}

function StatutGroup({ title, list }: { title: string; list: Statut[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {list.length === 0 && <p className="text-sm text-zinc-500">Aucun statut.</p>}
        {list.map((s) => {
          const boundUpdate = async (formData: FormData) => {
            "use server";
            await updateStatutEntry(s.id, formData);
          };
          const boundDelete = async () => {
            "use server";
            await deleteStatutEntry(s.id);
          };
          return <StatutItem key={s.id} statut={s} updateAction={boundUpdate} deleteAction={boundDelete} />;
        })}
      </div>
    </div>
  );
}
