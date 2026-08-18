"use client";

import type { Projet } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

export function PrestaCountsForm({
  projet,
  action,
}: {
  projet: Projet;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <AutosaveForm action={action} className="grid grid-cols-4 gap-4 rounded-lg border border-zinc-200 bg-white p-5">
      <Field label="Booké">
        <input type="number" name="nombre_booke" defaultValue={projet.nombre_booke} className="input" />
      </Field>
      <Field label="Tourné">
        <input type="number" name="nombre_tourne" defaultValue={projet.nombre_tourne} className="input" />
      </Field>
      <Field label="À monter">
        <input type="number" name="nombre_a_monter" defaultValue={projet.nombre_a_monter} className="input" />
      </Field>
      <Field label="Terminé">
        <input type="number" name="nombre_termine" defaultValue={projet.nombre_termine} className="input" />
      </Field>
    </AutosaveForm>
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
