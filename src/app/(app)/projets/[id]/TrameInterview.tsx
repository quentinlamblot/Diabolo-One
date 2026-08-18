"use client";

import { useState, useTransition } from "react";
import { AutosaveForm } from "@/components/AutosaveForm";
import type { TrameInterview as TrameInterviewData, TypeInterview } from "@/types/database";

export function TrameInterview({
  typeInterview,
  trame,
  genererAction,
  updateAction,
}: {
  typeInterview: TypeInterview;
  trame: TrameInterviewData | null;
  genererAction: () => Promise<void>;
  updateAction: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        await genererAction();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la génération.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">🎬 Trame d&apos;interview</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Offre : interview {typeInterview === "longue" ? "longue · 8 questions" : "courte · 4 questions"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-navy hover:bg-sand-dark disabled:opacity-50"
        >
          {isPending ? "Génération..." : trame ? "✨ Régénérer via IA" : "✨ Générer via IA"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {trame && (
        <AutosaveForm action={updateAction} className="mt-4">
          <textarea
            name="questions"
            defaultValue={trame.questions.join("\n")}
            rows={Math.max(trame.questions.length, 4) + 1}
            className="input w-full font-mono text-xs leading-relaxed"
          />
        </AutosaveForm>
      )}
    </div>
  );
}
