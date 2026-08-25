"use client";

import { useRef, useState } from "react";

export function AutosaveForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function submit() {
    const form = formRef.current;
    if (!form) return;
    setStatus("saving");
    Promise.resolve(action(new FormData(form))).finally(() => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    });
  }

  return (
    <form
      ref={formRef}
      onBlur={submit}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        if (target.tagName === "SELECT" || ["checkbox", "color", "date", "radio"].includes(target.type)) {
          // Repoussé après le prochain rendu : un onChange peut lui-même
          // déclencher un changement d'état React qui modifie quel champ
          // porte tel `name` (ex. un select "Autre" qui laisse place à un
          // input texte) ; lire le formulaire de façon synchrone capturerait
          // alors l'ancien DOM au lieu de la valeur voulue.
          setTimeout(submit, 0);
        }
      }}
      className={className}
    >
      {children}
      <div className="h-4 text-xs text-zinc-400">
        {status === "saving" ? "Enregistrement…" : status === "saved" ? "Enregistré ✓" : ""}
      </div>
    </form>
  );
}
