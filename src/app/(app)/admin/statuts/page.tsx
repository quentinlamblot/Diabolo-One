import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { Statut, Prestataire } from "@/types/database";
import { createStatutEntry, updateStatutEntry, deleteStatutEntry, resynchroniserContactsVideo, swapStatutOrdre } from "./actions";
import { StatutItem } from "./StatutItem";
import { ResyncButton } from "./ResyncButton";

export default async function StatutsAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: statuts }, { data: prestataires }] = await Promise.all([
    supabase
      .from("statuts")
      .select("*, statut_interviewe_lie:statut_interviewe_lie_id(*), statut_video_lie:statut_video_lie_id(*), responsable_defaut:responsable_defaut_id(*)")
      .order("type")
      .order("ordre"),
    supabase.from("prestataires").select("*").order("nom"),
  ]);
  const list = (statuts ?? []) as Statut[];
  const prestataireList = (prestataires ?? []) as Prestataire[];
  const projetStatuts = list.filter((s) => s.type === "projet");
  const intervieweStatuts = list.filter((s) => s.type === "interviewe");
  const videoStatuts = list.filter((s) => s.type === "video");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Statuts</h1>

      <form action={createStatutEntry} className="grid grid-cols-6 gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <select name="type" required className="input">
          <option value="projet">Statut projet</option>
          <option value="interviewe">Statut interviewé</option>
          <option value="video">Statut vidéo</option>
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
        <button type="submit" className="rounded-full bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-sky-dark">
          Ajouter
        </button>
      </form>
      <p className="-mt-4 text-xs text-zinc-500">
        La catégorie (vert/orange/rouge) est utilisée pour colorer les lignes du tableau de suivi des contacts.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Statuts vidéo</h2>
          <ResyncButton action={resynchroniserContactsVideo} />
        </div>
        <p className="-mt-1 mb-3 text-xs text-zinc-500">
          Les flèches réordonnent les colonnes du Kanban vidéo. « → contact » définit le statut appliqué
          automatiquement au contact lié quand une vidéo atteint cette étape. « Responsable par défaut » s&apos;applique
          à tout projet qui n&apos;a pas choisi son propre responsable pour cette colonne.
        </p>
        <div className="flex flex-wrap gap-2">
          {videoStatuts.length === 0 && <p className="text-sm text-zinc-500">Aucun statut.</p>}
          {videoStatuts.map((s, idx) => {
            const boundUpdate = async (formData: FormData) => {
              "use server";
              await updateStatutEntry(s.id, formData);
            };
            const boundDelete = async () => {
              "use server";
              await deleteStatutEntry(s.id);
            };
            const boundMoveUp = async () => {
              "use server";
              await swapStatutOrdre(s.id, videoStatuts[idx - 1].id);
            };
            const boundMoveDown = async () => {
              "use server";
              await swapStatutOrdre(s.id, videoStatuts[idx + 1].id);
            };
            return (
              <div key={s.id} className="flex items-center gap-1 rounded-md border border-zinc-100 p-1">
                <div className="flex flex-col">
                  <form action={boundMoveUp}>
                    <button type="submit" disabled={idx === 0} className="px-1 text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-20">
                      ▲
                    </button>
                  </form>
                  <form action={boundMoveDown}>
                    <button
                      type="submit"
                      disabled={idx === videoStatuts.length - 1}
                      className="px-1 text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </form>
                </div>
                <StatutItem
                  statut={s}
                  intervieweStatuts={intervieweStatuts}
                  prestataires={prestataireList}
                  updateAction={boundUpdate}
                  deleteAction={boundDelete}
                />
              </div>
            );
          })}
        </div>
      </div>

      <StatutGroup title="Statuts projet" list={projetStatuts} />
      <StatutGroup title="Statuts interviewé" list={intervieweStatuts} videoStatuts={videoStatuts} />
    </div>
  );
}

function StatutGroup({ title, list, videoStatuts }: { title: string; list: Statut[]; videoStatuts?: Statut[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h2>
      {videoStatuts && (
        <p className="-mt-1 mb-3 text-xs text-zinc-500">
          « → vidéo » crée ou fait avancer automatiquement la vidéo liée quand un contact atteint ce statut.
        </p>
      )}
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
          return <StatutItem key={s.id} statut={s} videoStatuts={videoStatuts} updateAction={boundUpdate} deleteAction={boundDelete} />;
        })}
      </div>
    </div>
  );
}
