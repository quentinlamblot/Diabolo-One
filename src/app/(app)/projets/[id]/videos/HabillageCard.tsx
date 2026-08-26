"use client";

import { AutosaveForm } from "@/components/AutosaveForm";
import { LinkOpener } from "@/components/LinkOpener";

export function HabillageCard({
  habillageFait,
  habillageLien,
  habillageDate,
  prestataireNom,
  canEdit,
  action,
}: {
  habillageFait: boolean;
  habillageLien: string | null;
  habillageDate: string | null;
  prestataireNom: string | null;
  canEdit: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const dateLabel = habillageDate ? new Date(habillageDate).toLocaleDateString("fr-FR") : null;

  if (!canEdit) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900">Habillage</span>
          <span className={`text-xs font-medium ${habillageFait ? "text-green-600" : "text-orange-600"}`}>
            {habillageFait ? "Fait ✓" : "À faire"}
          </span>
        </div>
        {dateLabel && <p className="text-xs text-zinc-500">Date limite : {dateLabel}</p>}
        {prestataireNom && <p className="text-xs text-zinc-500">Responsable : {prestataireNom}</p>}
        {habillageLien && (
          <a href={habillageLien} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline">
            Fichiers sources ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <AutosaveForm action={action} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">Habillage</span>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="habillage_fait" defaultChecked={habillageFait} className="h-4 w-4" />
          Fait
        </label>
      </div>
      {dateLabel && <p className="-mt-1 text-xs text-zinc-500">Date limite : {dateLabel}</p>}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-700">Lien vers les fichiers sources</span>
        <div className="flex items-center gap-1.5">
          <input name="habillage_lien" type="url" defaultValue={habillageLien ?? ""} placeholder="https://..." className="input" />
          <LinkOpener value={habillageLien} />
        </div>
      </label>
    </AutosaveForm>
  );
}
