"use client";

import type { Prestataire } from "@/types/database";
import { useRef } from "react";

export function AssignPrestataire({
  available,
  action,
}: {
  available: Prestataire[];
  action: (formData: FormData) => void;
}) {
  const ref = useRef<HTMLFormElement>(null);

  if (available.length === 0) return null;

  return (
    <form
      ref={ref}
      action={(fd) => {
        action(fd);
        ref.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <select name="prestataire_id" required className="input">
          <option value="">Affecter un prestataire...</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
        >
          Affecter
        </button>
      </div>
      <textarea
        name="commentaire"
        placeholder="Message pour le prestataire (optionnel, envoyé par email et ajouté à la messagerie)"
        rows={2}
        className="input"
      />
    </form>
  );
}
