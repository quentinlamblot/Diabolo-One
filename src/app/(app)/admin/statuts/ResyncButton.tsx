"use client";

import { useState, useTransition } from "react";

export function ResyncButton({ action }: { action: () => Promise<{ corriges: number }> }) {
  const [isPending, startTransition] = useTransition();
  const [resultat, setResultat] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setResultat(null);
          startTransition(async () => {
            const { corriges } = await action();
            setResultat(corriges);
          });
        }}
        className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
      >
        {isPending ? "Resynchronisation…" : "Resynchroniser les contacts maintenant"}
      </button>
      {resultat !== null && <span className="text-xs text-zinc-500">{resultat} contact(s) mis à jour</span>}
    </div>
  );
}
