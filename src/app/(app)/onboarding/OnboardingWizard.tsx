"use client";

import { useState, useTransition } from "react";
import { ONBOARDING_SECTIONS } from "./questions";
import { OnboardingStory } from "./OnboardingStory";

export function OnboardingWizard({
  clientNom,
  projetId,
  action,
}: {
  clientNom: string;
  projetId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [step, setStep] = useState(0); // 0 = accueil, 1..N = sections
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const totalSteps = ONBOARDING_SECTIONS.length;

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const currentSection = step >= 1 ? ONBOARDING_SECTIONS[step - 1] : null;

  function handleSubmit() {
    const fd = new FormData();
    for (const [key, value] of Object.entries(answers)) {
      fd.set(key, value);
    }
    startTransition(async () => {
      await action(fd);
      setSubmitted(true);
    });
  }

  if (submitted) {
    return <OnboardingStory projetId={projetId} />;
  }

  if (step === 0) {
    return (
      <div className="onboarding-step mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl text-zinc-900">Bienvenue chez Diabolo Agency, {clientNom} !</h1>
        <p className="text-sm text-zinc-500">
          Avant de démarrer votre projet vidéo, on aimerait en savoir un peu plus sur vous. Répondez à ce qui vous
          parle, passez le reste : rien n'est obligatoire.
        </p>
        <p className="text-xs text-zinc-400">{totalSteps} sections · quelques minutes</p>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mt-2 rounded-full bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
        >
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div key={step} className="onboarding-step mx-auto flex max-w-xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Étape {step} / {totalSteps}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full bg-sky-dark transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
        <h2 className="mt-4 text-xl text-zinc-900">{currentSection!.title}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {currentSection!.questions.map((q) => (
          <label key={q.key} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{q.label}</span>
            {q.type === "textarea" ? (
              <textarea
                value={answers[q.key] ?? ""}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                rows={3}
                className="input"
              />
            ) : q.type === "radio" ? (
              <div className="flex flex-col gap-1.5">
                {q.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={(e) => setAnswer(q.key, e.target.value)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input
                value={answers[q.key] ?? ""}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                className="input"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Précédent
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-sky-dark"
          >
            Suivant →
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-full bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-sky-dark disabled:opacity-40"
          >
            {isPending ? "Envoi..." : "Terminer"}
          </button>
        )}
      </div>
    </div>
  );
}
