"use client";

import type { Statut } from "@/types/database";
import { useTransition } from "react";

export function StatutSelect({
  statuts,
  value,
  onChange,
}: {
  statuts: Statut[];
  value: string | null;
  onChange: (statutId: string) => Promise<void>;
}) {
  const [, startTransition] = useTransition();
  const current = statuts.find((s) => s.id === value);

  return (
    <select
      defaultValue={value ?? ""}
      onChange={(e) => startTransition(() => onChange(e.target.value))}
      className="rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none"
      style={{
        backgroundColor: `${current?.couleur ?? "#94a3b8"}22`,
        color: current?.couleur ?? "#94a3b8",
      }}
    >
      <option value="">—</option>
      {statuts.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
