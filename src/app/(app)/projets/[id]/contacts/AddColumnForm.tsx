"use client";

import { useRef, useState } from "react";

export function AddColumnForm({ action }: { action: (formData: FormData) => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"texte" | "liste">("texte");

  return (
    <form
      ref={ref}
      action={(fd) => {
        action(fd);
        ref.current?.reset();
        setType("texte");
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input name="label" placeholder="Nom de la nouvelle colonne" required className="input w-56" />
      <select name="type" value={type} onChange={(e) => setType(e.target.value as "texte" | "liste")} className="input w-36">
        <option value="texte">Texte libre</option>
        <option value="liste">Menu déroulant</option>
      </select>
      {type === "liste" && (
        <input name="options" placeholder="Options séparées par des virgules" required className="input w-64" />
      )}
      <button type="submit" className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">
        + Ajouter une colonne
      </button>
    </form>
  );
}
