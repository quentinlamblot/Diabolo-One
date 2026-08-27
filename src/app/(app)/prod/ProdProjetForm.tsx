"use client";

import type { ProdProjet } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

export function ProdProjetForm({
  projet,
  action,
  submitLabel,
  autosave,
}: {
  projet?: ProdProjet;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  autosave?: boolean;
}) {
  const fields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom du projet">
          <input name="nom" defaultValue={projet?.nom} required className="input" />
        </Field>
        <Field label="Client">
          <input name="client" defaultValue={projet?.client ?? ""} className="input" />
        </Field>
        <Field label="Type de prestation">
          <input
            name="type_prestation"
            defaultValue={projet?.type_prestation ?? ""}
            placeholder="ex: after movie, interview, cadrage, montage..."
            className="input"
          />
        </Field>
        <Field label="Date">
          <input type="date" name="date_prestation" defaultValue={projet?.date_prestation ?? ""} className="input" />
        </Field>
        <Field label="Statut">
          <select name="statut" defaultValue={projet?.statut ?? "a_venir"} className="input">
            <option value="a_venir">À venir</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </Field>
        <Field label="Valeur du deal (€)">
          <input type="number" step="0.01" min={0} name="valeur_deal" defaultValue={projet?.valeur_deal ?? ""} className="input" />
        </Field>
        <Field label="Payé par le client le">
          <input type="date" name="date_paiement_client" defaultValue={projet?.date_paiement_client ?? ""} className="input" />
        </Field>
      </div>

      <Field label="Notes / infos liées au projet">
        <textarea name="notes" defaultValue={projet?.notes ?? ""} rows={4} className="input" />
      </Field>
    </>
  );

  if (autosave) {
    return (
      <AutosaveForm action={action} className="flex flex-col gap-6">
        {fields}
      </AutosaveForm>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {fields}
      <button type="submit" className="w-fit rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-dark">
        {submitLabel}
      </button>
    </form>
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
