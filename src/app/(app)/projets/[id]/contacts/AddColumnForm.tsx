"use client";

import { useRef } from "react";

export function AddColumnForm({ action }: { action: (formData: FormData) => void }) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={(fd) => {
        action(fd);
        ref.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input name="label" placeholder="Nom de la nouvelle colonne" required className="input w-56" />
      <button type="submit" className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">
        + Ajouter une colonne
      </button>
    </form>
  );
}
