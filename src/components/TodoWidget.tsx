"use client";

import type { Prestataire } from "@/types/database";

export interface TodoItem {
  id: string;
  titre: string;
  date: string | null;
  prestataire_id: string;
  fait: boolean;
  prestataireNom?: string;
}

function formatDateCourte(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function TodoWidget({
  todos,
  prestataires,
  showPrestataireName,
  canManage,
  toggleAction,
  createAction,
  deleteAction,
}: {
  todos: TodoItem[];
  prestataires?: Prestataire[];
  showPrestataireName: boolean;
  canManage: boolean;
  toggleAction: (id: string, fait: boolean) => Promise<void>;
  createAction?: (formData: FormData) => Promise<void>;
  deleteAction?: (id: string) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...todos].sort((a, b) => {
    if (a.fait !== b.fait) return a.fait ? 1 : -1;
    return (a.date ?? "9999-99-99").localeCompare(b.date ?? "9999-99-99");
  });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">To-Do</h2>

      {canManage && createAction && prestataires && (
        <form action={createAction} className="mb-4 flex flex-wrap items-end gap-2">
          <input name="titre" placeholder="Tâche" required className="input min-w-[160px] flex-1" />
          <input name="date" type="date" required className="input w-40" />
          <select name="prestataire_id" required defaultValue="" className="input w-40">
            <option value="" disabled>
              Prestataire...
            </option>
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark">
            Ajouter
          </button>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune tâche pour le moment.</p>
      ) : (
        <div className="flex flex-col divide-y divide-zinc-100">
          {sorted.map((t) => {
            const late = !t.fait && !!t.date && t.date < today;
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <form action={() => toggleAction(t.id, !t.fait)}>
                  <input
                    type="checkbox"
                    defaultChecked={t.fait}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="h-4 w-4"
                  />
                </form>
                <span className={`flex-1 ${t.fait ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{t.titre}</span>
                {showPrestataireName && t.prestataireNom && <span className="text-xs text-zinc-500">{t.prestataireNom}</span>}
                {t.date && (
                  <span className={`text-xs ${late ? "font-medium text-red-600" : "text-zinc-400"}`}>{formatDateCourte(t.date)}</span>
                )}
                {canManage && deleteAction && (
                  <form action={() => deleteAction(t.id)}>
                    <button type="submit" className="text-zinc-400 hover:text-red-600" aria-label="Supprimer">
                      ×
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
