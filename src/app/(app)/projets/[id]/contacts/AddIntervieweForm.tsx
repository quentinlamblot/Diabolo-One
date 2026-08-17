"use client";

import { useRef } from "react";
import type { Statut } from "@/types/database";

export function AddIntervieweForm({
  statuts,
  action,
}: {
  statuts: Statut[];
  action: (formData: FormData) => void;
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={(fd) => {
        action(fd);
        ref.current?.reset();
      }}
      className="grid grid-cols-7 gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <input name="prenom" placeholder="Prénom" className="input" />
      <input name="nom" placeholder="Nom" required className="input" />
      <input name="email" type="email" placeholder="Email" className="input" />
      <input name="telephone" placeholder="Téléphone" className="input" />
      <input name="date_rdv" type="date" title="Date du RDV" className="input" />
      <select name="statut_id" defaultValue="" className="input">
        <option value="">Statut...</option>
        {statuts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Ajouter
      </button>
    </form>
  );
}
